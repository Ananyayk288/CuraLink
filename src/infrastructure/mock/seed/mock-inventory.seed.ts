import { InventoryItem } from "@/modules/pharmacy/domain/entities/inventory-item";
import { InventoryBatch } from "@/modules/pharmacy/domain/entities/inventory-batch";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysFromNow = (d: number) => {
  const dt = new Date(now.getTime() + d * 86400 * 1000);
  return dt.toISOString().substring(0, 10);
};

export const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "e0000001-0000-0000-0000-000000000001",
    medicineName: "Metformin 500mg",
    brandOrGeneric: "Glyciphage (Generic Metformin)",
    distributorId: "dist-med-india-01",
    stockQuantity: 120,
    lowStockThreshold: 30,
    lastUpdatedAt: hoursAgo(2), // FRESH (< 24h)
  },
  {
    id: "e0000001-0000-0000-0000-000000000002",
    medicineName: "Glimepiride 1mg",
    brandOrGeneric: "Amaryl (Glimepiride)",
    distributorId: "dist-med-india-01",
    stockQuantity: 60,
    lowStockThreshold: 20,
    lastUpdatedAt: hoursAgo(30), // AGING (24h - 72h)
  },
  {
    id: "e0000001-0000-0000-0000-000000000003",
    medicineName: "Atorvastatin 10mg",
    brandOrGeneric: "Atorva (Atorvastatin)",
    distributorId: "dist-med-india-02",
    stockQuantity: 45,
    lowStockThreshold: 15,
    lastUpdatedAt: hoursAgo(96), // STALE (> 72h)
  },
  {
    id: "e0000001-0000-0000-0000-000000000004",
    medicineName: "Amoxicillin 500mg",
    brandOrGeneric: "Mox 500",
    distributorId: "dist-med-india-01",
    stockQuantity: 80,
    lowStockThreshold: 25,
    lastUpdatedAt: hoursAgo(5), // FRESH
  },
  {
    id: "e0000001-0000-0000-0000-000000000005",
    medicineName: "Amlodipine 10mg",
    brandOrGeneric: "Norvasc / Amlong",
    distributorId: "dist-med-india-02",
    stockQuantity: 50,
    lowStockThreshold: 15,
    lastUpdatedAt: hoursAgo(10), // FRESH
  },
  {
    id: "e0000001-0000-0000-0000-000000000006",
    medicineName: "Paracetamol 650mg",
    brandOrGeneric: "Dolo 650",
    distributorId: "dist-med-india-01",
    stockQuantity: 200,
    lowStockThreshold: 50,
    lastUpdatedAt: hoursAgo(1), // FRESH
  },
];

export const SEED_INVENTORY_BATCHES: InventoryBatch[] = [
  {
    id: "b0000001-0000-0000-0000-000000000001",
    inventoryItemId: "e0000001-0000-0000-0000-000000000001",
    medicineName: "Metformin 500mg",
    batchNumber: "B-MET-2026-X1",
    expiryDate: daysFromNow(180),
    stockQuantity: 70,
  },
  {
    id: "b0000001-0000-0000-0000-000000000002",
    inventoryItemId: "e0000001-0000-0000-0000-000000000001",
    medicineName: "Metformin 500mg",
    batchNumber: "B-MET-2026-X2",
    expiryDate: daysFromNow(360),
    stockQuantity: 50,
  },
  {
    id: "b0000001-0000-0000-0000-000000000003",
    inventoryItemId: "e0000001-0000-0000-0000-000000000002",
    medicineName: "Glimepiride 1mg",
    batchNumber: "B-GLI-2026-A1",
    expiryDate: daysFromNow(210),
    stockQuantity: 60,
  },
  {
    id: "b0000001-0000-0000-0000-000000000004",
    inventoryItemId: "e0000001-0000-0000-0000-000000000003",
    medicineName: "Atorvastatin 10mg",
    batchNumber: "B-ATO-2026-B1",
    expiryDate: daysFromNow(150),
    stockQuantity: 45,
  },
  {
    id: "b0000001-0000-0000-0000-000000000005",
    inventoryItemId: "e0000001-0000-0000-0000-000000000004",
    medicineName: "Amoxicillin 500mg",
    batchNumber: "B-AMX-2026-C1",
    expiryDate: daysFromNow(90),
    stockQuantity: 80,
  },
  {
    id: "b0000001-0000-0000-0000-000000000006",
    inventoryItemId: "e0000001-0000-0000-0000-000000000005",
    medicineName: "Amlodipine 10mg",
    batchNumber: "B-AML-2026-D1",
    expiryDate: daysFromNow(240),
    stockQuantity: 50,
  },
  {
    id: "b0000001-0000-0000-0000-000000000007",
    inventoryItemId: "e0000001-0000-0000-0000-000000000006",
    medicineName: "Paracetamol 650mg",
    batchNumber: "B-PCM-2026-E1",
    expiryDate: daysFromNow(300),
    stockQuantity: 200,
  },
];
