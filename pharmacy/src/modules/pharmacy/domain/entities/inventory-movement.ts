export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  medicineName?: string;
  batchNumber?: string;
  batchId?: string;
  type?: "DISPENSE" | "RESTOCK" | "ADJUSTMENT" | string;
  change: number; // Negative for deductions, e.g. -30
  quantityChanged?: number;
  quantityAfter?: number;
  reason: string;
  performedBy?: string;
  dispenseEventId?: string;
  timestamp: string;
}
