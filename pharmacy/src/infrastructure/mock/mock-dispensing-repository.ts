import { DispensingRepository } from "@/modules/pharmacy/ports/dispensing-repository.port";
import { DispenseEvent } from "@/modules/pharmacy/domain/entities/dispense-event";
import { DispenseStatus } from "@/modules/pharmacy/domain/enums/dispense-status.enum";

export class MockDispensingRepository implements DispensingRepository {
  private events: DispenseEvent[] = [
    // Pre-seed a partial dispense for Vikram Rao's revision 1
    {
      id: "dsp-seed-vikram-rev1",
      prescriptionMedicineId: "d0000001-0000-0000-0000-000000000005",
      prescriptionId: "c0000001-0000-0000-0000-000000000003",
      patientId: "AV-000003",
      pharmacyId: "fac-city-general",
      medicineName: "Amlodipine 5mg",
      batchNumber: "B-AML-OLD-01",
      expiryDate: "2027-06-30",
      quantity: 15,
      receiptNo: "RCP-20261008-OLD1",
      status: DispenseStatus.DISPENSED,
      idempotencyKey: "idemp-vikram-old-rev1",
      dispensedBy: "a0000001-0000-0000-0000-000000000001",
      dispensedAt: "2026-10-08T14:30:00Z",
    },
  ];

  async saveDispenseEvent(
    event: Omit<DispenseEvent, "id" | "dispensedAt">
  ): Promise<DispenseEvent> {
    const record: DispenseEvent = {
      ...event,
      id: `dsp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dispensedAt: new Date().toISOString(),
    };
    this.events.push(record);
    return record;
  }

  async findByIdempotencyKey(key: string): Promise<DispenseEvent | null> {
    const found = this.events.find((e) => e.idempotencyKey === key);
    return found || null;
  }

  async findByPrescriptionId(prescriptionId: string): Promise<DispenseEvent[]> {
    return this.events.filter((e) => e.prescriptionId === prescriptionId);
  }

  async findByMedicineId(prescriptionMedicineId: string): Promise<DispenseEvent | null> {
    const found = this.events.find(
      (e) => e.prescriptionMedicineId === prescriptionMedicineId
    );
    return found || null;
  }

  async findByReceiptNo(receiptNo: string): Promise<DispenseEvent[]> {
    return this.events.filter((e) => e.receiptNo === receiptNo);
  }

  // Clear helper for isolated test runs
  clear(): void {
    this.events = [];
  }
}
