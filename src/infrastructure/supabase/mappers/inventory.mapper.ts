import { InventoryItem } from "@/modules/pharmacy/domain/entities/inventory-item";

export interface SupabaseInventoryRow {
  id: string;
  medicine_name: string;
  brand_or_generic: string;
  distributor_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  last_updated_at: string;
}

export function mapSupabaseToInventoryItem(row: SupabaseInventoryRow): InventoryItem {
  return {
    id: row.id,
    medicineName: row.medicine_name,
    brandOrGeneric: row.brand_or_generic,
    distributorId: row.distributor_id,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    lastUpdatedAt: row.last_updated_at,
  };
}
