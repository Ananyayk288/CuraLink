import { AuditLog } from "@/core/domain/entities/audit-log";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";

export interface SupabaseAuditLogRow {
  id: string;
  actor_id: string;
  actor_role: string;
  action_type: string;
  target_entity: string;
  target_id: string;
  timestamp: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
}

export function mapSupabaseToAuditLog(row: SupabaseAuditLogRow): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    actionType: row.action_type as AuditAction,
    targetEntity: row.target_entity,
    targetId: row.target_id,
    timestamp: row.timestamp,
    ipAddress: row.ip_address || undefined,
    metadata: row.metadata || undefined,
  };
}
