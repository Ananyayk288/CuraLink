import { DomainEvent } from "@/core/ports/event-publisher.port";

export interface InventoryUpdatedPayload {
  inventoryItemId: string;
  medicineName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  updatedBy: string;
}

export class InventoryUpdatedEvent implements DomainEvent {
  public readonly eventName = "InventoryUpdated";
  public readonly occurredAt: string;
  public readonly payload: Record<string, unknown>;

  constructor(data: InventoryUpdatedPayload, occurredAt: string = new Date().toISOString()) {
    this.occurredAt = occurredAt;
    this.payload = data as unknown as Record<string, unknown>;
  }
}
