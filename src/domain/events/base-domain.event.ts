import { randomUUID } from 'node:crypto';

export abstract class BaseDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;

  protected constructor(
    eventType: string,
    eventId?: string,
    occurredOn?: Date,
  ) {
    this.eventType = eventType;
    this.eventId = eventId ?? randomUUID();
    this.occurredOn = occurredOn ?? new Date();
  }
}
