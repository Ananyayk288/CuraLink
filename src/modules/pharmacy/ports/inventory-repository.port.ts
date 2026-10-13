import { InventoryItem } from "../domain/entities/inventory-item";
import { InventoryBatch } from "../domain/entities/inventory-batch";
import { InventoryMovement } from "../domain/entities/inventory-movement";

export interface InventoryRepository {
  findAll(): Promise<InventoryItem[]>;
  findById(id: string): Promise<InventoryItem | null>;
  findByName(medicineName: string): Promise<InventoryItem | null>;
  findBatchesByMedicineName(medicineName: string): Promise<InventoryBatch[]>;
  findBatchByNumber(batchNumber: string): Promise<InventoryBatch | null>;
  decrementStock(id: string, quantity: number, batchNumber?: string): Promise<InventoryItem>;
  updateStock(id: string, newQuantity: number): Promise<InventoryItem>;
  recordMovement(movement: Omit<InventoryMovement, "id" | "timestamp">): Promise<InventoryMovement>;
  getMovementsByItemId(inventoryItemId: string): Promise<InventoryMovement[]>;
}
