import { EventPublisher, DomainEvent } from "@/core/ports/event-publisher.port";

export class MockEventPublisher implements EventPublisher {
  public publishedEvents: DomainEvent[] = [];

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    this.publishedEvents.push(event);
    // Future subscribers: telephony/IVR engine, hospital notifications
    if (process.env.NODE_ENV !== "test") {
      console.log(`[EventPublisher] Dispatched event: ${event.eventName}`, event.payload);
    }
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    for (const e of events) {
      await this.publish(e);
    }
  }

  clear(): void {
    this.publishedEvents = [];
  }
}
