export interface InventoryItem {
  id: string;
  medicineName: string;
  brandOrGeneric: string;
  distributorId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  lastUpdatedAt: string; // ISO UTC
}
