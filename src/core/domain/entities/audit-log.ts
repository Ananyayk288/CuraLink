import { AuditAction } from "../enums/audit-action.enum";

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  actionType: AuditAction;
  targetEntity: string;
  targetId: string;
  timestamp: string; // ISO UTC
  ipAddress?: string;
  metadata?: Record<string, unknown>; // Never contains sensitive clinical notes
}
