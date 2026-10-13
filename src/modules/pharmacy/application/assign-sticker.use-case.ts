import { StickerRepository } from "../ports/sticker-repository.port";
import { PrescriptionReadPort } from "../ports/prescription-read.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError } from "@/core/domain/errors/domain-error";
import { DoseSlot } from "../domain/enums/dose-slot.enum";
import { StickerAssignment } from "../domain/entities/sticker-assignment";
import { validateStickerSlots } from "../domain/rules/sticker-uniqueness.rule";

export interface AssignStickerDto {
  prescriptionMedicineId: string;
  prescriptionId: string;
  slots: DoseSlot[];
  beforeFood?: boolean;
}

export class AssignStickerUseCase {
  constructor(
    private readonly stickerRepository: StickerRepository,
    private readonly prescriptionReadPort: PrescriptionReadPort,
    private readonly authProvider: AuthProvider,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(dto: AssignStickerDto, token?: string): Promise<StickerAssignment> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);

    const prescription = await this.prescriptionReadPort.getPrescriptionById(dto.prescriptionId);
    if (!prescription) {
      throw new NotFoundError(`Prescription ${dto.prescriptionId} not found`);
    }

    const medicineExists = prescription.medicines.some(
      (m) => m.id === dto.prescriptionMedicineId
    );
    if (!medicineExists) {
      throw new NotFoundError(
        `Medicine ${dto.prescriptionMedicineId} does not belong to prescription ${dto.prescriptionId}`
      );
    }

    // Validate slots (at least one, no duplicates)
    validateStickerSlots({
      slots: dto.slots,
      beforeFood: dto.beforeFood,
    });

    const assignment: StickerAssignment = {
      id: `sa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      prescriptionMedicineId: dto.prescriptionMedicineId,
      prescriptionId: dto.prescriptionId,
      slots: dto.slots,
      beforeFood: dto.beforeFood,
      assignedBy: user.id,
      assignedAt: this.clock.nowIso(),
    };

    if (this.stickerRepository.assign) {
      await this.stickerRepository.assign(assignment);
    }

    await this.auditLogRepository.append({
      actorId: user.id,
      actorRole: user.role,
      actionType: AuditAction.STICKER_ASSIGNED,
      targetEntity: "STICKER_ASSIGNMENT",
      targetId: assignment.id,
      timestamp: this.clock.nowIso(),
      metadata: {
        prescriptionId: dto.prescriptionId,
        slots: dto.slots,
        beforeFood: dto.beforeFood,
      },
    });

    return assignment;
  }
}
