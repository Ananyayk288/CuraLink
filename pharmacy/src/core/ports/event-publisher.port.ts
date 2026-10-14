export interface DomainEvent {
  eventName: string;
  occurredAt: string; // ISO UTC
  payload: Record<string, unknown>;
}

export interface EventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishBatch<T extends DomainEvent>(events: T[]): Promise<void>;
}
