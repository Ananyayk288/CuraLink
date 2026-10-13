import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditLog } from "@/core/domain/entities/audit-log";

export interface FormattedAuditActivity {
  id: string;
  actionType: string;
  targetEntity: string;
  targetId: string;
  timestampIst: string;
  timestampIso: string;
  metadata?: Record<string, unknown>;
}

export class GetPharmacistActivityUseCase {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly authProvider: AuthProvider,
    private readonly clock: Clock
  ) {}

  async execute(token?: string): Promise<FormattedAuditActivity[]> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);
    const logs = await this.auditLogRepository.findByActorId(user.id);

    return logs.map((log: AuditLog) => ({
      id: log.id,
      actionType: log.actionType,
      targetEntity: log.targetEntity,
      targetId: log.targetId,
      timestampIst: this.clock.formatIst(log.timestamp),
      timestampIso: log.timestamp,
      metadata: log.metadata,
    }));
  }
}
