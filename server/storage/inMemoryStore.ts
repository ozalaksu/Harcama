import { randomUUID } from 'node:crypto';
import { EventInput, EventRecord, EventStore, SessionRecord } from '../types.js';

export class InMemoryStore implements EventStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly events = new Map<string, EventRecord>();

  async createSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.sessionToken, session);
  }

  async getSession(sessionToken: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(sessionToken);

    if (!session) {
      return null;
    }

    if (!session.isActive || new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session;
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    const session = this.sessions.get(sessionToken);

    if (!session) {
      return;
    }

    this.sessions.set(sessionToken, {
      ...session,
      isActive: false
    });
  }

  async listEvents(): Promise<EventRecord[]> {
    return Array.from(this.events.values()).sort((left, right) =>
      right.date.localeCompare(left.date)
    );
  }

  async createEvent(input: EventInput): Promise<EventRecord> {
    const event: EventRecord = {
      id: randomUUID(),
      title: input.title.trim(),
      date: input.date ?? new Date().toISOString(),
      participants: input.participants ?? [],
      expenses: input.expenses ?? []
    };

    this.events.set(event.id, event);
    return event;
  }

  async updateEvent(eventId: string, event: EventRecord): Promise<EventRecord | null> {
    if (!this.events.has(eventId)) {
      return null;
    }

    const updatedEvent = {
      ...event,
      id: eventId
    };

    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return this.events.delete(eventId);
  }
}
