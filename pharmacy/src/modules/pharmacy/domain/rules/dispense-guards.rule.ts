import { ValidationError } from "@/core/domain/errors/domain-error";
import { Prescription } from "../entities/prescription";
import { PrescriptionStatus } from "../enums/prescription-status.enum";
import { InventoryItem } from "../entities/inventory-item";

export interface ValidateDispenseGuardParams {
  prescription: Prescription;
  medicineId: string;
  patientRequiresStickers: boolean;
  isStickerConfirmed?: boolean;
  hasStickerPlan?: boolean;
  inventoryItem?: InventoryItem;
  quantityRequested: number;
  batchNumber: string;
  expiryDateStr: string; // YYYY-MM-DD
  currentDate?: Date;
  minShelfLifeDays?: number;
}

export function validateDispenseGuards(params: ValidateDispenseGuardParams): void {
  const {
    prescription,
    medicineId,
    patientRequiresStickers,
    isStickerConfirmed,
    hasStickerPlan = true,
    inventoryItem,
    quantityRequested,
    batchNumber,
    expiryDateStr,
    currentDate = new Date(),
    minShelfLifeDays = 30,
  } = params;

  // 1. Prescription status check
  if (prescription.status !== PrescriptionStatus.COMMITTED) {
    if (prescription.status === PrescriptionStatus.SUPERSEDED) {
      throw new ValidationError(
        "Prescription has been SUPERSEDED by a newer revision. Dispensing an obsolete revision is prohibited."
      );
    }
    throw new ValidationError(
      `Prescription is in status "${prescription.status}". Only COMMITTED prescriptions can be dispensed.`
    );
  }

  // 2. Batch number check
  if (!batchNumber || batchNumber.trim().length === 0) {
    throw new ValidationError("Batch number is required for dispensing.");
  }

  // 3. Expiry date and minimum shelf-life check
  if (!expiryDateStr) {
    throw new ValidationError("Expiry date is required for dispensing.");
  }

  const expiryDate = new Date(expiryDateStr);
  if (isNaN(expiryDate.getTime())) {
    throw new ValidationError("Invalid expiry date format. Expected YYYY-MM-DD.");
  }

  const minAcceptableDate = new Date(currentDate.getTime() + minShelfLifeDays * 24 * 60 * 60 * 1000);
  if (expiryDate <= currentDate) {
    throw new ValidationError(
      `Cannot dispense expired medication (Expiry: ${expiryDateStr}).`
    );
  }

  if (expiryDate < minAcceptableDate) {
    throw new ValidationError(
      `Medicine shelf-life (${expiryDateStr}) is less than required minimum safety margin of ${minShelfLifeDays} days.`
    );
  }

  // 4. Sticker dose slot assignment & confirmation check for patients requiring stickers
  if (patientRequiresStickers) {
    if (!hasStickerPlan) {
      throw new ValidationError(
        "Sticker plan missing, contact the doctor."
      );
    }
    if (!isStickerConfirmed) {
      throw new ValidationError(
        "Physical stickers must be confirmed before dispensing."
      );
    }
  }

  // 5. Inventory stock check
  if (!inventoryItem) {
    throw new ValidationError(
      "No matching inventory item found for this medicine."
    );
  }

  if (inventoryItem.stockQuantity < quantityRequested) {
    throw new ValidationError(
      `Insufficient inventory: requested ${quantityRequested} units, but only ${inventoryItem.stockQuantity} units available.`
    );
  }
}
