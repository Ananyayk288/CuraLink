import { DispensingRepository } from "@/modules/pharmacy/ports/dispensing-repository.port";
import { DispenseEvent } from "@/modules/pharmacy/domain/entities/dispense-event";
import { DispenseStatus } from "@/modules/pharmacy/domain/enums/dispense-status.enum";
import { getSupabaseClient } from "./client";

export class SupabaseDispensingRepository implements DispensingRepository {
  private mapRow(d: Record<string, unknown>): DispenseEvent {
    return {
      id: d.id as string,
      prescriptionMedicineId: d.prescription_medicine_id as string,
      prescriptionId: d.prescription_id as string,
      patientId: d.patient_id as string,
      pharmacyId: d.pharmacy_id as string,
      medicineName: d.medicine_name as string,
      batchNumber: d.batch_number as string,
      expiryDate: d.expiry_date as string,
      quantity: d.quantity as number,
      receiptNo: d.receipt_no as string,
      status: d.status as DispenseStatus,
      idempotencyKey: d.idempotency_key as string,
      dispensedBy: d.dispensed_by as string,
      dispensedAt: d.dispensed_at as string,
    };
  }

  async saveDispenseEvent(
    event: Omit<DispenseEvent, "id" | "dispensedAt">
  ): Promise<DispenseEvent> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("dispense_events")
      .insert({
        prescription_medicine_id: event.prescriptionMedicineId,
        prescription_id: event.prescriptionId,
        patient_id: event.patientId,
        pharmacy_id: event.pharmacyId,
        medicine_name: event.medicineName,
        batch_number: event.batchNumber,
        expiry_date: event.expiryDate,
        quantity: event.quantity,
        receipt_no: event.receiptNo,
        status: event.status,
        idempotency_key: event.idempotencyKey,
        dispensed_by: event.dispensedBy,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to save dispense event: ${error?.message}`);
    }

    return this.mapRow(data);
  }

  async findByIdempotencyKey(key: string): Promise<DispenseEvent | null> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("dispense_events")
      .select("*")
      .eq("idempotency_key", key)
      .maybeSingle();

    return data ? this.mapRow(data) : null;
  }

  async findByPrescriptionId(prescriptionId: string): Promise<DispenseEvent[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("dispense_events")
      .select("*")
      .eq("prescription_id", prescriptionId);

    return data ? data.map((d) => this.mapRow(d)) : [];
  }

  async findByMedicineId(prescriptionMedicineId: string): Promise<DispenseEvent | null> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("dispense_events")
      .select("*")
      .eq("prescription_medicine_id", prescriptionMedicineId)
      .maybeSingle();

    return data ? this.mapRow(data) : null;
  }

  async findByReceiptNo(receiptNo: string): Promise<DispenseEvent[]> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("dispense_events")
      .select("*")
      .eq("receipt_no", receiptNo);

    return data ? data.map((d) => this.mapRow(d)) : [];
  }
}
