import { AuditLog } from "../domain/entities/audit-log";

export interface AuditLogRepository {
  append(log: Omit<AuditLog, "id">): Promise<AuditLog>;
  findByActorId(actorId: string): Promise<AuditLog[]>;
  findByEntity(targetEntity: string, targetId: string): Promise<AuditLog[]>;
  getAll(limit?: number): Promise<AuditLog[]>;
}
