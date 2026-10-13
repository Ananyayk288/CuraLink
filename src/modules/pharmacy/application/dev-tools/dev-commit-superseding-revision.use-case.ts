import { PrescriptionReadPort } from "../../ports/prescription-read.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { Clock } from "@/core/ports/clock.port";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError } from "@/core/domain/errors/domain-error";
import { Prescription } from "../../domain/entities/prescription";

export interface DevPrescriptionMutationPort extends PrescriptionReadPort {
  commitNewRevision(
    previousPrescriptionId: string,
    newMedicines?: { medicineName: string; dosage: string; frequency: string; duration: string }[]
  ): Promise<Prescription>;
}

export class DevCommitSupersedingRevisionUseCase {
  constructor(
    private readonly mutationPort: DevPrescriptionMutationPort,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(
    previousPrescriptionId: string,
    newMedicines?: { medicineName: string; dosage: string; frequency: string; duration: string }[]
  ): Promise<Prescription> {
    const prev = await this.mutationPort.getPrescriptionById(previousPrescriptionId);
    if (!prev) {
      throw new NotFoundError(`Prescription ${previousPrescriptionId} not found.`);
    }

    const newRev = await this.mutationPort.commitNewRevision(
      previousPrescriptionId,
      newMedicines
    );

    await this.auditLogRepository.append({
      actorId: prev.doctorId,
      actorRole: "DOCTOR",
      actionType: AuditAction.REVISION_COMMITTED,
      targetEntity: "PRESCRIPTION",
      targetId: newRev.id,
      timestamp: this.clock.nowIso(),
      metadata: {
        previousRevisionId: previousPrescriptionId,
        newRevisionNumber: newRev.revision,
        simulatedByDevTools: true,
      },
    });

    return newRev;
  }
}
