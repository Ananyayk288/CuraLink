import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { AuditLog } from "@/core/domain/entities/audit-log";

export class MockAuditLogRepository implements AuditLogRepository {
  private logs: AuditLog[] = [];

  async append(log: Omit<AuditLog, "id">): Promise<AuditLog> {
    const entry: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.logs.push(entry);
    return entry;
  }

  async findByActorId(actorId: string): Promise<AuditLog[]> {
    return this.logs
      .filter((l) => l.actorId === actorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async findByEntity(targetEntity: string, targetId: string): Promise<AuditLog[]> {
    return this.logs
      .filter((l) => l.targetEntity === targetEntity && l.targetId === targetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAll(limit: number = 100): Promise<AuditLog[]> {
    return [...this.logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  clear(): void {
    this.logs = [];
  }
}
