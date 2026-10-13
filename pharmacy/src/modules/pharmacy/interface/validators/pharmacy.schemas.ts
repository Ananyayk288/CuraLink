import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
});

export const PatientLookupSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
});

export const ConfirmStickerSchema = z.object({
  prescriptionMedicineId: z.string().min(1, "Medicine ID is required"),
});

export const DispenseItemSchema = z.object({
  prescriptionMedicineId: z.string().min(1, "Medicine ID is required"),
  batchNumber: z.string().min(1, "Batch number is required").max(64),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format"),
});

export const DispensePrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, "Prescription ID is required"),
  items: z.array(DispenseItemSchema).min(1, "At least one medicine must be specified"),
});

export const UpdateInventorySchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item ID is required"),
  newStockQuantity: z
    .number()
    .int()
    .min(0, "Stock quantity cannot be negative"),
  reason: z.string().min(3, "Reason for stock adjustment is required"),
});

export const DevCommitRevisionSchema = z.object({
  prescriptionId: z.string().min(1, "Prescription ID is required"),
  newMedicines: z
    .array(
      z.object({
        medicineName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
      })
    )
    .optional(),
});
