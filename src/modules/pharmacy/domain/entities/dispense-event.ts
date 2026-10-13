import { DispenseStatus } from "../enums/dispense-status.enum";

export interface DispenseEvent {
  id: string;
  prescriptionMedicineId: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  receiptNo: string;
  status: DispenseStatus;
  idempotencyKey: string;
  dispensedBy: string; // Pharmacist user ID
  dispensedAt: string; // ISO UTC
}
