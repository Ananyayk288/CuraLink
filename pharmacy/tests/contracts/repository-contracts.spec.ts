import { describe, it, expect } from "vitest";
import { MockStickerConfirmationRepository } from "@/infrastructure/mock/mock-sticker-confirmation-repository";
import { MockDispensingRepository } from "@/infrastructure/mock/mock-dispensing-repository";
import { MockInventoryRepository } from "@/infrastructure/mock/mock-inventory-repository";
import { DispenseStatus } from "@/modules/pharmacy/domain/enums/dispense-status.enum";

describe("Repository Port Contract Tests", () => {
  describe("StickerConfirmationRepository Contract", () => {
    it("should confirm and retrieve physical sticker confirmations", async () => {
      const repo = new MockStickerConfirmationRepository();

      const confirmed = await repo.confirm("med-contract-1", "user-1");

      expect(confirmed.id).toBeDefined();
      expect(confirmed.prescriptionMedicineId).toBe("med-contract-1");
      expect(confirmed.confirmedBy).toBe("user-1");
      expect(confirmed.confirmedAt).toBeDefined();

      const byMed = await repo.findByMedicineId("med-contract-1");
      expect(byMed).toBeDefined();
      expect(byMed?.prescriptionMedicineId).toBe("med-contract-1");

      // Idempotent confirmation: confirming again returns the existing record
      const reconfirmed = await repo.confirm("med-contract-1", "user-1");
      expect(reconfirmed.id).toBe(confirmed.id);
    });
  });

  describe("DispensingRepository Contract", () => {
    it("should store append-only events and retrieve by idempotency key", async () => {
      const repo = new MockDispensingRepository();

      const event = await repo.saveDispenseEvent({
        prescriptionMedicineId: "med-c-1",
        prescriptionId: "presc-c-1",
        patientId: "pat-c-1",
        pharmacyId: "pharm-c-1",
        medicineName: "Metformin",
        batchNumber: "B-TEST",
        expiryDate: "2027-01-01",
        quantity: 10,
        receiptNo: "RCP-TEST-001",
        status: DispenseStatus.DISPENSED,
        idempotencyKey: "key-contract-1",
        dispensedBy: "user-1",
      });

      expect(event.id).toBeDefined();

      const found = await repo.findByIdempotencyKey("key-contract-1");
      expect(found).toBeDefined();
      expect(found?.receiptNo).toBe("RCP-TEST-001");
    });
  });

  describe("InventoryRepository Contract", () => {
    it("should decrement and update inventory quantities accurately", async () => {
      const repo = new MockInventoryRepository();
      const all = await repo.findAll();
      const target = all[0];
      const initialQty = target.stockQuantity;

      const decremented = await repo.decrementStock(target.id, 5);
      expect(decremented.stockQuantity).toBe(initialQty - 5);

      const updated = await repo.updateStock(target.id, 50);
      expect(updated.stockQuantity).toBe(50);
    });

    it("should query batches by medicine name and batch number", async () => {
      const repo = new MockInventoryRepository();
      const batches = await repo.findBatchesByMedicineName("Metformin 500mg");
      expect(batches.length).toBeGreaterThan(0);
      expect(batches[0].medicineName).toBe("Metformin 500mg");

      const byNumber = await repo.findBatchByNumber(batches[0].batchNumber);
      expect(byNumber).toBeDefined();
      expect(byNumber?.batchNumber).toBe(batches[0].batchNumber);
    });

    it("should record inventory movements as an append-only ledger", async () => {
      const repo = new MockInventoryRepository();
      const movement = await repo.recordMovement({
        inventoryItemId: "inv-item-1",
        change: -30,
        medicineName: "Metformin 500mg",
        batchNumber: "B-MET-2026-X1",
        type: "DISPENSE",
        quantityChanged: -30,
        quantityAfter: 90,
        reason: "Prescription Dispense",
        performedBy: "user-1",
      });

      expect(movement.id).toBeDefined();
      expect(movement.timestamp).toBeDefined();

      const history = await repo.getMovementsByItemId("inv-item-1");
      expect(history.length).toBe(1);
      expect(history[0].type).toBe("DISPENSE");
    });
  });
});
