import { describe, it, expect, beforeEach } from "vitest";
import { getContainer } from "@/infrastructure/container";

describe("Atomic Dispense Idempotency and Stock Protection", () => {
  const container = getContainer();

  const prescId = "c0000001-0000-0000-0000-000000000001"; // Suresh's prescription
  const med1Id = "d0000001-0000-0000-0000-000000000001"; // Metformin 500mg
  const med2Id = "d0000001-0000-0000-0000-000000000002"; // Glimepiride 1mg
  const med3Id = "d0000001-0000-0000-0000-000000000003"; // Atorvastatin 10mg
  const idempotencyKey = `idemp-${Date.now()}-test-key`;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 180);
  const expiryDate = futureDate.toISOString().substring(0, 10);

  beforeEach(async () => {
    // Confirm stickers for all prescribed medicines for sticker-required patient
    await container.confirmStickerUseCase.execute({
      prescriptionMedicineId: med1Id,
    });
    await container.confirmStickerUseCase.execute({
      prescriptionMedicineId: med2Id,
    });
    await container.confirmStickerUseCase.execute({
      prescriptionMedicineId: med3Id,
    });
  });

  it("should atomically dispense prescription on first attempt and reject double-decrementing stock on idempotent replay", async () => {
    // 1. Check initial inventory stock
    const itemBefore = await container.inventoryRepository.findByName("Metformin 500mg");
    expect(itemBefore).toBeDefined();
    const initialStock = itemBefore!.stockQuantity;

    const itemsToDispense = [
      {
        prescriptionMedicineId: med1Id,
        batchNumber: "B-MET-2026-X1",
        expiryDate,
        quantity: 10,
      },
      {
        prescriptionMedicineId: med2Id,
        batchNumber: "B-GLI-2026-A1",
        expiryDate,
        quantity: 2,
      },
      {
        prescriptionMedicineId: med3Id,
        batchNumber: "B-ATO-2026-B1",
        expiryDate,
        quantity: 5,
      },
    ];

    // 2. Execute first atomic prescription dispense
    const firstCall = await container.dispensePrescriptionUseCase.execute({
      prescriptionId: prescId,
      items: itemsToDispense,
      idempotencyKey,
    });

    expect(firstCall.isIdempotentReplay).toBe(false);
    expect(firstCall.receiptNo).toBeDefined();
    expect(firstCall.itemsDispensed).toBe(3);

    // 3. Verify stock decremented by 10 for Metformin
    const itemAfterFirst = await container.inventoryRepository.findByName("Metformin 500mg");
    expect(itemAfterFirst!.stockQuantity).toBe(initialStock - 10);

    // 4. Replay IDENTICAL request with same Idempotency-Key
    const secondCall = await container.dispensePrescriptionUseCase.execute({
      prescriptionId: prescId,
      items: itemsToDispense,
      idempotencyKey, // EXACT SAME KEY
    });

    expect(secondCall.isIdempotentReplay).toBe(true);
    expect(secondCall.receiptNo).toBe(firstCall.receiptNo);

    // 5. CRITICAL CHECK: Stock must NOT have decremented again!
    const itemAfterSecond = await container.inventoryRepository.findByName("Metformin 500mg");
    expect(itemAfterSecond!.stockQuantity).toBe(initialStock - 10);
  });
});
