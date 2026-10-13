export interface InventoryBatch {
  id: string;
  inventoryItemId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  stockQuantity: number;
}
