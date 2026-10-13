import { DomainEvent } from "@/core/ports/event-publisher.port";
import { DoseSlot } from "../enums/dose-slot.enum";

export interface MedicineDispensedWithStickerPayload {
  patientId: string;
  prescriptionMedicineId: string;
  slots: DoseSlot[];
  beforeFood: boolean;
  dispenseEventId?: string;
  prescriptionId?: string;
  medicineName?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  receiptNo?: string;
  dispensedBy?: string;
}

export class MedicineDispensedWithStickerEvent implements DomainEvent {
  public readonly eventName = "MedicineDispensedWithSticker";
  public readonly occurredAt: string;
  public readonly payload: Record<string, unknown>;

  constructor(data: MedicineDispensedWithStickerPayload, occurredAt: string = new Date().toISOString()) {
    this.occurredAt = occurredAt;
    this.payload = data as unknown as Record<string, unknown>;
  }
}
