import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { AuditLog } from "@/core/domain/entities/audit-log";
import { getSupabaseClient } from "./client";
import {
  SupabaseAuditLogRow,
  mapSupabaseToAuditLog,
} from "./mappers/audit.mapper";

export class SupabaseAuditLogRepository implements AuditLogRepository {
  async append(log: Omit<AuditLog, "id">): Promise<AuditLog> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("audit_logs")
      .insert({
        actor_id: log.actorId,
        actor_role: log.actorRole,
        action_type: log.actionType,
        target_entity: log.targetEntity,
        target_id: log.targetId,
        timestamp: log.timestamp,
        ip_address: log.ipAddress,
        metadata: log.metadata || {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to append audit log: ${error?.message}`);
    }

    return mapSupabaseToAuditLog(data as SupabaseAuditLogRow);
  }

  async findByActorId(actorId: string): Promise<AuditLog[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("audit_logs")
      .select("*")
      .eq("actor_id", actorId)
      .order("timestamp", { ascending: false });

    if (!data) return [];
    return data.map((d) => mapSupabaseToAuditLog(d as SupabaseAuditLogRow));
  }

  async findByEntity(targetEntity: string, targetId: string): Promise<AuditLog[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("audit_logs")
      .select("*")
      .eq("target_entity", targetEntity)
      .eq("target_id", targetId)
      .order("timestamp", { ascending: false });

    if (!data) return [];
    return data.map((d) => mapSupabaseToAuditLog(d as SupabaseAuditLogRow));
  }

  async getAll(limit: number = 100): Promise<AuditLog[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (!data) return [];
    return data.map((d) => mapSupabaseToAuditLog(d as SupabaseAuditLogRow));
  }
}
