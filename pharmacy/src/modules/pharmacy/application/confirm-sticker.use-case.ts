import { StickerConfirmationRepository } from "../ports/sticker-confirmation-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { StickerConfirmation } from "../domain/entities/sticker-confirmation";

export interface ConfirmStickerDto {
  prescriptionMedicineId: string;
}

export class ConfirmStickerUseCase {
  constructor(
    private readonly stickerConfirmationRepository: StickerConfirmationRepository,
    private readonly authProvider: AuthProvider,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(dto: ConfirmStickerDto, token?: string): Promise<StickerConfirmation> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);

    const confirmation = await this.stickerConfirmationRepository.confirm(
      dto.prescriptionMedicineId,
      user.id
    );

    await this.auditLogRepository.append({
      actorId: user.id,
      actorRole: user.role,
      actionType: AuditAction.STICKER_CONFIRMED,
      targetEntity: "StickerConfirmation",
      targetId: confirmation.id,
      timestamp: this.clock.nowIso(),
      metadata: {
        prescriptionMedicineId: dto.prescriptionMedicineId,
        confirmedAt: confirmation.confirmedAt,
      },
    });

    return confirmation;
  }
}
