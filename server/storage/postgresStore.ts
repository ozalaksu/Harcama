import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { EventInput, EventRecord, EventStore, SessionRecord } from '../types.js';

const schemaSql = `
  CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    expenses JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS app_sessions (
    id UUID PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  );
`;

const normalizeEvent = (row: {
  id: string;
  title: string;
  date: string | Date;
  participants: unknown;
  expenses: unknown;
}): EventRecord => ({
  id: row.id,
  title: row.title,
  date: row.date instanceof Date ? row.date.toISOString() : new Date(row.date).toISOString(),
  participants: Array.isArray(row.participants) ? row.participants : [],
  expenses: Array.isArray(row.expenses) ? row.expenses : []
});

export class PostgresStore implements EventStore {
  constructor(private readonly pool: Pool) {}

  async ensureSchema(): Promise<void> {
    await this.pool.query(schemaSql);
  }

  async createSession(session: SessionRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO app_sessions (id, session_token, is_active, expires_at)
        VALUES ($1, $2, $3, $4)
      `,
      [randomUUID(), session.sessionToken, session.isActive, session.expiresAt]
    );
  }

  async getSession(sessionToken: string): Promise<SessionRecord | null> {
    const result = await this.pool.query<{
      session_token: string;
      is_active: boolean;
      expires_at: Date;
    }>(
      `
        SELECT session_token, is_active, expires_at
        FROM app_sessions
        WHERE session_token = $1
          AND is_active = TRUE
          AND expires_at > NOW()
      `,
      [sessionToken]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      sessionToken: row.session_token,
      isActive: row.is_active,
      expiresAt: row.expires_at.toISOString()
    };
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE app_sessions
        SET is_active = FALSE
        WHERE session_token = $1
      `,
      [sessionToken]
    );
  }

  async listEvents(): Promise<EventRecord[]> {
    const result = await this.pool.query<{
      id: string;
      title: string;
      date: string | Date;
      participants: unknown;
      expenses: unknown;
    }>(
      `
        SELECT id, title, date, participants, expenses
        FROM events
        ORDER BY date DESC
      `
    );

    return result.rows.map(normalizeEvent);
  }

  async createEvent(input: EventInput): Promise<EventRecord> {
    const eventId = randomUUID();
    const result = await this.pool.query<{
      id: string;
      title: string;
      date: string | Date;
      participants: unknown;
      expenses: unknown;
    }>(
      `
        INSERT INTO events (id, title, date, participants, expenses)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING id, title, date, participants, expenses
      `,
      [
        eventId,
        input.title.trim(),
        input.date ?? new Date().toISOString(),
        JSON.stringify(input.participants ?? []),
        JSON.stringify(input.expenses ?? [])
      ]
    );

    return normalizeEvent(result.rows[0]);
  }

  async updateEvent(eventId: string, event: EventRecord): Promise<EventRecord | null> {
    const result = await this.pool.query<{
      id: string;
      title: string;
      date: string | Date;
      participants: unknown;
      expenses: unknown;
    }>(
      `
        UPDATE events
        SET title = $2,
            date = $3,
            participants = $4::jsonb,
            expenses = $5::jsonb,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, title, date, participants, expenses
      `,
      [
        eventId,
        event.title.trim(),
        event.date,
        JSON.stringify(event.participants),
        JSON.stringify(event.expenses)
      ]
    );

    if (!result.rows[0]) {
      return null;
    }

    return normalizeEvent(result.rows[0]);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    return (result.rowCount ?? 0) > 0;
  }
}
