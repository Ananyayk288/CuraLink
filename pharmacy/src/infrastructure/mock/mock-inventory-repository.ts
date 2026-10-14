import { InventoryRepository } from "@/modules/pharmacy/ports/inventory-repository.port";
import { InventoryItem } from "@/modules/pharmacy/domain/entities/inventory-item";
import { InventoryBatch } from "@/modules/pharmacy/domain/entities/inventory-batch";
import { InventoryMovement } from "@/modules/pharmacy/domain/entities/inventory-movement";
import { SEED_INVENTORY, SEED_INVENTORY_BATCHES } from "./seed/mock-inventory.seed";

export class MockInventoryRepository implements InventoryRepository {
  private items: InventoryItem[] = JSON.parse(JSON.stringify(SEED_INVENTORY));
  private batches: InventoryBatch[] = JSON.parse(JSON.stringify(SEED_INVENTORY_BATCHES));
  private movements: InventoryMovement[] = [];

  async findAll(): Promise<InventoryItem[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const item = this.items.find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  async findByName(medicineName: string): Promise<InventoryItem | null> {
    const norm = medicineName.toLowerCase().trim();
    const item = this.items.find((i) => i.medicineName.toLowerCase().trim() === norm);
    return item ? { ...item } : null;
  }

  async findBatchesByMedicineName(medicineName: string): Promise<InventoryBatch[]> {
    const norm = medicineName.toLowerCase().trim();
    return this.batches
      .filter((b) => b.medicineName.toLowerCase().trim() === norm)
      .map((b) => ({ ...b }));
  }

  async findBatchByNumber(batchNumber: string): Promise<InventoryBatch | null> {
    const batch = this.batches.find((b) => b.batchNumber === batchNumber);
    return batch ? { ...batch } : null;
  }

  async decrementStock(id: string, quantity: number, batchNumber?: string): Promise<InventoryItem> {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Inventory item ${id} not found.`);
    }

    const current = this.items[index];
    const newQty = Math.max(0, current.stockQuantity - quantity);
    const updated: InventoryItem = {
      ...current,
      stockQuantity: newQty,
      lastUpdatedAt: new Date().toISOString(),
    };
    this.items[index] = updated;

    if (batchNumber) {
      const batchIdx = this.batches.findIndex((b) => b.batchNumber === batchNumber);
      if (batchIdx !== -1) {
        this.batches[batchIdx].stockQuantity = Math.max(0, this.batches[batchIdx].stockQuantity - quantity);
      }
    }

    return { ...updated };
  }

  async updateStock(id: string, newQuantity: number): Promise<InventoryItem> {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Inventory item ${id} not found.`);
    }

    const current = this.items[index];
    const updated: InventoryItem = {
      ...current,
      stockQuantity: newQuantity,
      lastUpdatedAt: new Date().toISOString(),
    };

    this.items[index] = updated;
    return { ...updated };
  }

  async recordMovement(movement: Omit<InventoryMovement, "id" | "timestamp">): Promise<InventoryMovement> {
    const fullMovement: InventoryMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.movements.push(fullMovement);
    return { ...fullMovement };
  }

  async getMovementsByItemId(inventoryItemId: string): Promise<InventoryMovement[]> {
    return this.movements
      .filter((m) => m.inventoryItemId === inventoryItemId)
      .map((m) => ({ ...m }));
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(SEED_INVENTORY));
    this.batches = JSON.parse(JSON.stringify(SEED_INVENTORY_BATCHES));
    this.movements = [];
  }
}
