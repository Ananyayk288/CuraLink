import { DispenseEvent } from "../domain/entities/dispense-event";

export interface DispensingRepository {
  saveDispenseEvent(
    event: Omit<DispenseEvent, "id" | "dispensedAt">
  ): Promise<DispenseEvent>;
  findByIdempotencyKey(key: string): Promise<DispenseEvent | null>;
  findByPrescriptionId(prescriptionId: string): Promise<DispenseEvent[]>;
  findByMedicineId(prescriptionMedicineId: string): Promise<DispenseEvent | null>;
  findByReceiptNo(receiptNo: string): Promise<DispenseEvent[]>;
}
