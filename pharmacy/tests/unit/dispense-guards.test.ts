import { describe, it, expect } from "vitest";
import { validateDispenseGuards } from "@/modules/pharmacy/domain/rules/dispense-guards.rule";
import { PrescriptionStatus } from "@/modules/pharmacy/domain/enums/prescription-status.enum";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";

describe("Dispense Guards Domain Rules", () => {
  const basePrescription = {
    id: "presc-1",
    patientId: "pat-1",
    doctorId: "doc-1",
    doctorName: "Dr. Amit Sen",
    hospitalId: "hosp-1",
    status: PrescriptionStatus.COMMITTED,
    revision: 1,
    committedAt: "2026-10-10T10:00:00Z",
    createdAt: "2026-10-10T09:00:00Z",
    medicines: [
      {
        id: "med-1",
        prescriptionId: "presc-1",
        medicineName: "Metformin 500mg",
        dosage: "500mg",
        frequency: "BD",
        duration: "30 days",
        doseSlots: [DoseSlot.MORNING, DoseSlot.NIGHT],
        beforeFood: false,
        quantityPrescribed: 30,
      },
    ],
  };

  const baseInventory = {
    id: "inv-1",
    medicineName: "Metformin 500mg",
    brandOrGeneric: "Glyciphage",
    distributorId: "dist-1",
    stockQuantity: 100,
    lowStockThreshold: 20,
    lastUpdatedAt: new Date().toISOString(),
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const validExpiryStr = futureDate.toISOString().substring(0, 10);

  it("should pass when all guard conditions are met", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: true,
        isStickerConfirmed: true,
        hasStickerPlan: true,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: validExpiryStr,
      })
    ).not.toThrow();
  });

  it("should reject dispensing if prescription is SUPERSEDED", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: { ...basePrescription, status: PrescriptionStatus.SUPERSEDED },
        medicineId: "med-1",
        patientRequiresStickers: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: validExpiryStr,
      })
    ).toThrow(/SUPERSEDED/i);
  });

  it("should reject dispensing if batch number is missing", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "",
        expiryDateStr: validExpiryStr,
      })
    ).toThrow(/Batch number is required/i);
  });

  it("should reject dispensing if medicine has expired", () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 5);
    const expiredStr = expiredDate.toISOString().substring(0, 10);

    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: expiredStr,
      })
    ).toThrow(/expired/i);
  });

  it("should reject dispensing if shelf-life is less than minimum margin (30 days)", () => {
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(nearExpiryDate.getDate() + 10);
    const nearExpiryStr = nearExpiryDate.toISOString().substring(0, 10);

    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: nearExpiryStr,
        minShelfLifeDays: 30,
      })
    ).toThrow(/shelf-life/i);
  });

  it("should reject dispensing if patient requires stickers but doctor sticker plan is missing", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: true,
        hasStickerPlan: false,
        isStickerConfirmed: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: validExpiryStr,
      })
    ).toThrow(/Sticker plan missing, contact the doctor/i);
  });

  it("should reject dispensing if patient requires stickers but stickers are not confirmed", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: true,
        hasStickerPlan: true,
        isStickerConfirmed: false,
        inventoryItem: baseInventory,
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: validExpiryStr,
      })
    ).toThrow(/Physical stickers must be confirmed/i);
  });

  it("should reject dispensing if inventory stock is insufficient", () => {
    expect(() =>
      validateDispenseGuards({
        prescription: basePrescription,
        medicineId: "med-1",
        patientRequiresStickers: false,
        inventoryItem: { ...baseInventory, stockQuantity: 5 },
        quantityRequested: 30,
        batchNumber: "B12345",
        expiryDateStr: validExpiryStr,
      })
    ).toThrow(/Insufficient inventory/i);
  });
});
