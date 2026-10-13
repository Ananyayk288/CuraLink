import { PrescriptionReadPort } from "../ports/prescription-read.port";
import { StickerConfirmationRepository } from "../ports/sticker-confirmation-repository.port";
import { DispensingRepository } from "../ports/dispensing-repository.port";
import { InventoryRepository } from "../ports/inventory-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError } from "@/core/domain/errors/domain-error";
import { patientLookupRateLimiter } from "@/lib/rate-limiter";
import { PatientSummary } from "../domain/entities/patient-summary";
import { EnrichedMedicineLine } from "./get-patient-active-prescription.use-case";

export const GENERIC_NOT_FOUND_MESSAGE = "No active prescription found for this ID";

export interface PatientLookupResult {
  patient: PatientSummary;
  prescription: {
    id: string;
    revision: number;
    doctorName: string;
    hospitalId: string;
    status: string;
    committedAt: string;
    dispensedAt?: string;
    hasRevisedNotice: boolean;
    revisedBannerMessage?: string;
    isFullyDispensed: boolean;
  };
  medicineLines: EnrichedMedicineLine[];
}

export class LookupPatientActivePrescriptionUseCase {
  constructor(
    private readonly prescriptionReadPort: PrescriptionReadPort,
    private readonly stickerConfirmationRepository: StickerConfirmationRepository,
    private readonly dispensingRepository: DispensingRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly authProvider: AuthProvider,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(rawPatientId: string, token?: string): Promise<PatientLookupResult> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);

    // 1. Rate-limit lookups per pharmacist
    patientLookupRateLimiter.enforce(user.id);

    // 2. Exact-match normalization: trim and uppercase
    const normalizedId = (rawPatientId || "").trim().toUpperCase();

    // 3. Reject empty or invalid input immediately
    if (!normalizedId) {
      await this.auditLogRepository.append({
        actorId: user.id,
        actorRole: user.role,
        actionType: AuditAction.PATIENT_SEARCH_PERFORMED,
        targetEntity: "PATIENT",
        targetId: "UNKNOWN",
        timestamp: this.clock.nowIso(),
        metadata: { found: false, reason: "EMPTY_INPUT" },
      });
      throw new NotFoundError(GENERIC_NOT_FOUND_MESSAGE);
    }

    // 4. Query active COMMITTED prescription
    const activeData = await this.prescriptionReadPort.getActiveCommittedByPatientId(normalizedId);

    // If no active committed prescription found
    if (!activeData) {
      await this.auditLogRepository.append({
        actorId: user.id,
        actorRole: user.role,
        actionType: AuditAction.PATIENT_SEARCH_PERFORMED,
        targetEntity: "PATIENT",
        targetId: normalizedId,
        timestamp: this.clock.nowIso(),
        metadata: { found: false },
      });
      throw new NotFoundError(GENERIC_NOT_FOUND_MESSAGE);
    }

    const { prescription, patient } = activeData;

    // 5. Audit successful lookup
    await this.auditLogRepository.append({
      actorId: user.id,
      actorRole: user.role,
      actionType: AuditAction.PATIENT_SEARCH_PERFORMED,
      targetEntity: "PATIENT",
      targetId: patient.id,
      timestamp: this.clock.nowIso(),
      metadata: {
        found: true,
        prescriptionId: prescription.id,
        revision: prescription.revision,
      },
    });

    // 6. Check if latest revision replaced one that was partly dispensed
    const isRevisedFromPartial =
      await this.prescriptionReadPort.isRevisedFromPartiallyDispensed(prescription.id);

    // 7. Enrich active medicine lines
    const confirmations = await this.stickerConfirmationRepository.findByPrescriptionId(prescription.id);
    const dispenses = await this.dispensingRepository.findByPrescriptionId(prescription.id);

    const enrichedLines: EnrichedMedicineLine[] = await Promise.all(
      prescription.medicines.map(async (med) => {
        const isStickerConfirmed = confirmations.some((c) => c.prescriptionMedicineId === med.id);
        const dispenseEvent = dispenses.find((d) => d.prescriptionMedicineId === med.id);
        const hasPlan = Boolean(med.doseSlots && med.doseSlots.length > 0);
        const batches = await this.inventoryRepository.findBatchesByMedicineName(med.medicineName);
        const sortedBatches = batches.sort(
          (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );

        return {
          medicine: med,
          stickerPlan: hasPlan
            ? {
                slots: med.doseSlots,
                beforeFood: Boolean(med.beforeFood),
              }
            : null,
          isStickerConfirmed,
          availableBatches: sortedBatches,
          dispenseEvent,
          isDispensed: Boolean(dispenseEvent),
        };
      })
    );

    const isFullyDispensed =
      enrichedLines.length > 0 && enrichedLines.every((l) => l.isDispensed);

    const latestDispense = dispenses.length > 0
      ? dispenses.sort((a, b) => new Date(b.dispensedAt).getTime() - new Date(a.dispensedAt).getTime())[0]
      : undefined;

    return {
      patient,
      prescription: {
        id: prescription.id,
        revision: prescription.revision,
        doctorName: prescription.doctorName,
        hospitalId: prescription.hospitalId,
        status: isFullyDispensed ? "DISPENSED" : prescription.status,
        committedAt: prescription.committedAt,
        dispensedAt: isFullyDispensed ? latestDispense?.dispensedAt : undefined,
        hasRevisedNotice: isRevisedFromPartial,
        revisedBannerMessage: isRevisedFromPartial
          ? "This prescription was revised. Dispense only what is shown here."
          : undefined,
        isFullyDispensed,
      },
      medicineLines: enrichedLines,
    };
  }
}
