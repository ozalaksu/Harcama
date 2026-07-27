import { randomUUID } from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import { EventInput, EventRecord, EventStore } from './types.js';

interface CreateAppOptions {
  authPassword: string;
  sessionDurationDays: number;
  store: EventStore;
}

interface AuthenticatedRequest extends Request {
  sessionToken?: string;
}

const sendError = (response: Response, status: number, message: string) => {
  response.status(status).json({ message });
};

const isEventRecord = (value: unknown): value is EventRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const event = value as Partial<EventRecord>;
  return typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    Array.isArray(event.participants) &&
    Array.isArray(event.expenses);
};

const parseEventInput = (value: unknown): EventInput | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const event = value as Partial<EventInput>;
  if (typeof event.title !== 'string' || !event.title.trim()) {
    return null;
  }

  return {
    title: event.title,
    date: typeof event.date === 'string' ? event.date : undefined,
    participants: Array.isArray(event.participants) ? event.participants : [],
    expenses: Array.isArray(event.expenses) ? event.expenses : []
  };
};

export const createApp = ({ authPassword, sessionDurationDays, store }: CreateAppOptions) => {
  const app = express();

  app.use(express.json());

  const requireAuth = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ) => {
    const authorizationHeader = request.headers.authorization;
    const sessionToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length)
      : undefined;

    if (!sessionToken) {
      return sendError(response, 401, 'Authentication required');
    }

    const session = await store.getSession(sessionToken);
    if (!session) {
      return sendError(response, 401, 'Invalid session');
    }

    request.sessionToken = sessionToken;
    next();
  };

  app.post('/api/auth/login', async (request, response) => {
    const { password } = request.body as { password?: string };

    if (password !== authPassword) {
      return sendError(response, 401, 'Invalid password');
    }

    const expiresAt = new Date(
      Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const sessionToken = randomUUID();

    await store.createSession({
      sessionToken,
      expiresAt,
      isActive: true
    });

    response.json({
      sessionToken,
      expiresAt
    });
  });

  app.get('/api/auth/session', requireAuth, async (_request, response) => {
    response.json({ valid: true });
  });

  app.post('/api/auth/logout', requireAuth, async (request, response) => {
    await store.deactivateSession((request as AuthenticatedRequest).sessionToken!);
    response.status(204).send();
  });

  app.get('/api/events', requireAuth, async (_request, response) => {
    const events = await store.listEvents();
    response.json(events);
  });

  app.post('/api/events', requireAuth, async (request, response) => {
    const eventInput = parseEventInput(request.body);
    if (!eventInput) {
      return sendError(response, 400, 'Invalid event payload');
    }

    const event = await store.createEvent(eventInput);
    response.status(201).json(event);
  });

  app.put('/api/events/:eventId', requireAuth, async (request, response) => {
    if (!isEventRecord(request.body)) {
      return sendError(response, 400, 'Invalid event payload');
    }

    const eventId = Array.isArray(request.params.eventId)
      ? request.params.eventId[0]
      : request.params.eventId;
    const event = await store.updateEvent(eventId, request.body);
    if (!event) {
      return sendError(response, 404, 'Event not found');
    }

    response.json(event);
  });

  app.delete('/api/events/:eventId', requireAuth, async (request, response) => {
    const eventId = Array.isArray(request.params.eventId)
      ? request.params.eventId[0]
      : request.params.eventId;
    const deleted = await store.deleteEvent(eventId);
    if (!deleted) {
      return sendError(response, 404, 'Event not found');
    }

    response.status(204).send();
  });

  return app;
};
