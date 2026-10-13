import { DispensingRepository } from "../ports/dispensing-repository.port";
import { StickerConfirmationRepository } from "../ports/sticker-confirmation-repository.port";
import { PrescriptionReadPort } from "../ports/prescription-read.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { NotFoundError } from "@/core/domain/errors/domain-error";
import { DoseSlot } from "../domain/enums/dose-slot.enum";
import { formatMedicineStickersSummary } from "../domain/config/sticker-slot-config";

export interface ReceiptItemLine {
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  slots: DoseSlot[];
  beforeFood: boolean;
  stickersSummary: string;
  stickersConfirmed: boolean;
}

export const formatStickersSummary = formatMedicineStickersSummary;

export interface PrintableReceiptData {
  receiptNo: string;
  dispensedAtIso: string;
  dispensedAtIst: string;
  dispensedByName: string;
  pharmacyId: string;
  patient: {
    id: string;
    displayName: string;
  };
  prescription: {
    id: string;
    revision: number;
    doctorName: string;
  };
  items: ReceiptItemLine[];
  notice: string;
}

export class GetReceiptUseCase {
  constructor(
    private readonly dispensingRepository: DispensingRepository,
    private readonly stickerConfirmationRepository: StickerConfirmationRepository,
    private readonly prescriptionReadPort: PrescriptionReadPort,
    private readonly authProvider: AuthProvider,
    private readonly clock: Clock
  ) {}

  async execute(receiptNo: string, token?: string): Promise<PrintableReceiptData> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);
    const events = await this.dispensingRepository.findByReceiptNo(receiptNo);

    if (!events || events.length === 0) {
      throw new NotFoundError(`Receipt "${receiptNo}" not found.`);
    }

    const firstEvent = events[0];
    const prescription = await this.prescriptionReadPort.getPrescriptionById(
      firstEvent.prescriptionId
    );
    if (!prescription) {
      throw new NotFoundError(`Prescription ${firstEvent.prescriptionId} not found.`);
    }

    const activeData = await this.prescriptionReadPort.getActiveCommittedByPatientId(
      firstEvent.patientId
    );

    const items: ReceiptItemLine[] = await Promise.all(
      events.map(async (event) => {
        const med = prescription.medicines.find((m) => m.id === event.prescriptionMedicineId);
        const confirmation = await this.stickerConfirmationRepository.findByMedicineId(
          event.prescriptionMedicineId
        );
        const slots = med?.doseSlots || [];
        const beforeFood = Boolean(med?.beforeFood);
        return {
          medicineName: event.medicineName,
          batchNumber: event.batchNumber,
          expiryDate: event.expiryDate,
          quantity: event.quantity,
          slots,
          beforeFood,
          stickersSummary: formatStickersSummary(slots, beforeFood),
          stickersConfirmed: Boolean(confirmation),
        };
      })
    );

    return {
      receiptNo,
      dispensedAtIso: firstEvent.dispensedAt,
      dispensedAtIst: this.clock.formatIst(firstEvent.dispensedAt),
      dispensedByName: user.fullName,
      pharmacyId: firstEvent.pharmacyId,
      patient: {
        id: firstEvent.patientId,
        displayName: activeData?.patient.displayName || "Patient",
      },
      prescription: {
        id: prescription.id,
        revision: prescription.revision,
        doctorName: prescription.doctorName,
      },
      items,
      notice: "CuraLink Dispensing Record. Coordination aid — not an autonomous medical decision-maker.",
    };
  }
}
