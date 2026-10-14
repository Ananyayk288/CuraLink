import { InventoryRepository } from "@/modules/pharmacy/ports/inventory-repository.port";
import { InventoryItem } from "@/modules/pharmacy/domain/entities/inventory-item";
import { InventoryBatch } from "@/modules/pharmacy/domain/entities/inventory-batch";
import { InventoryMovement } from "@/modules/pharmacy/domain/entities/inventory-movement";
import { getSupabaseClient } from "./client";
import {
  SupabaseInventoryRow,
  mapSupabaseToInventoryItem,
} from "./mappers/inventory.mapper";

export class SupabaseInventoryRepository implements InventoryRepository {
  async findAll(): Promise<InventoryItem[]> {
    const client = getSupabaseClient();
    const { data } = await client.from("inventory_items").select("*");
    if (!data) return [];
    return data.map((d) => mapSupabaseToInventoryItem(d as SupabaseInventoryRow));
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const client = getSupabaseClient();
    const { data } = await client.from("inventory_items").select("*").eq("id", id).maybeSingle();
    return data ? mapSupabaseToInventoryItem(data as SupabaseInventoryRow) : null;
  }

  async findByName(medicineName: string): Promise<InventoryItem | null> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("inventory_items")
      .select("*")
      .ilike("medicine_name", medicineName)
      .maybeSingle();

    return data ? mapSupabaseToInventoryItem(data as SupabaseInventoryRow) : null;
  }

  async findBatchesByMedicineName(medicineName: string): Promise<InventoryBatch[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("inventory_batches")
      .select("*")
      .ilike("medicine_name", medicineName)
      .order("expiry_date", { ascending: true });

    if (!data) return [];
    return data.map((b) => ({
      id: b.id,
      inventoryItemId: b.inventory_item_id,
      medicineName: b.medicine_name,
      batchNumber: b.batch_number,
      expiryDate: b.expiry_date,
      stockQuantity: b.stock_quantity,
    }));
  }

  async findBatchByNumber(batchNumber: string): Promise<InventoryBatch | null> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("inventory_batches")
      .select("*")
      .eq("batch_number", batchNumber)
      .maybeSingle();

    if (!data) return null;
    return {
      id: data.id,
      inventoryItemId: data.inventory_item_id,
      medicineName: data.medicine_name,
      batchNumber: data.batch_number,
      expiryDate: data.expiry_date,
      stockQuantity: data.stock_quantity,
    };
  }

  async decrementStock(id: string, quantity: number, batchNumber?: string): Promise<InventoryItem> {
    const current = await this.findById(id);
    if (!current) throw new Error(`Inventory item ${id} not found.`);

    const client = getSupabaseClient();
    const newQty = Math.max(0, current.stockQuantity - quantity);
    const { data, error } = await client
      .from("inventory_items")
      .update({
        stock_quantity: newQty,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to decrement stock: ${error?.message}`);

    if (batchNumber) {
      const { data: batch } = await client
        .from("inventory_batches")
        .select("stock_quantity")
        .eq("batch_number", batchNumber)
        .maybeSingle();

      if (batch) {
        await client
          .from("inventory_batches")
          .update({
            stock_quantity: Math.max(0, batch.stock_quantity - quantity),
          })
          .eq("batch_number", batchNumber);
      }
    }

    return mapSupabaseToInventoryItem(data as SupabaseInventoryRow);
  }

  async updateStock(id: string, newQuantity: number): Promise<InventoryItem> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("inventory_items")
      .update({
        stock_quantity: newQuantity,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update stock: ${error?.message}`);
    return mapSupabaseToInventoryItem(data as SupabaseInventoryRow);
  }

  async recordMovement(movement: Omit<InventoryMovement, "id" | "timestamp">): Promise<InventoryMovement> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("inventory_movements")
      .insert({
        inventory_item_id: movement.inventoryItemId,
        medicine_name: movement.medicineName,
        batch_number: movement.batchNumber,
        type: movement.type,
        quantity_changed: movement.quantityChanged,
        quantity_after: movement.quantityAfter,
        reason: movement.reason,
        performed_by: movement.performedBy,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to record movement: ${error?.message}`);
    return {
      id: data.id,
      inventoryItemId: data.inventory_item_id,
      medicineName: data.medicine_name,
      batchNumber: data.batch_number,
      type: data.type,
      change: data.quantity_changed || movement.change || 0,
      quantityChanged: data.quantity_changed,
      quantityAfter: data.quantity_after,
      reason: data.reason,
      performedBy: data.performed_by,
      timestamp: data.timestamp,
    };
  }

  async getMovementsByItemId(inventoryItemId: string): Promise<InventoryMovement[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("inventory_movements")
      .select("*")
      .eq("inventory_item_id", inventoryItemId)
      .order("timestamp", { ascending: false });

    if (!data) return [];
    return data.map((m) => ({
      id: m.id,
      inventoryItemId: m.inventory_item_id,
      medicineName: m.medicine_name,
      batchNumber: m.batch_number,
      type: m.type,
      change: m.quantity_changed || 0,
      quantityChanged: m.quantity_changed,
      quantityAfter: m.quantity_after,
      reason: m.reason,
      performedBy: m.performed_by,
      timestamp: m.timestamp,
    }));
  }
}
