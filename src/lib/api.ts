import { Event } from '../types/app';

const jsonHeaders = {
  'Content-Type': 'application/json'
};

const getHeaders = (sessionToken?: string) => ({
  ...jsonHeaders,
  ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
});

const readResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = 'Request failed';

    try {
      const body = await response.json() as { message?: string };
      message = body.message || message;
    } catch {
      // Ignore JSON parsing issues and use the default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  async login(password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ password })
    });

    return readResponse<{ sessionToken: string; expiresAt: string }>(response);
  },

  async validateSession(sessionToken: string) {
    const response = await fetch('/api/auth/session', {
      headers: getHeaders(sessionToken)
    });

    return readResponse<{ valid: true }>(response);
  },

  async logout(sessionToken: string) {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders(sessionToken)
    });

    return readResponse<void>(response);
  },

  async listEvents(sessionToken: string) {
    const response = await fetch('/api/events', {
      headers: getHeaders(sessionToken)
    });

    return readResponse<Event[]>(response);
  },

  async createEvent(
    sessionToken: string,
    payload: Omit<Event, 'id'> & Partial<Pick<Event, 'id'>>
  ) {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(sessionToken),
      body: JSON.stringify(payload)
    });

    return readResponse<Event>(response);
  },

  async updateEvent(sessionToken: string, event: Event) {
    const response = await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: getHeaders(sessionToken),
      body: JSON.stringify(event)
    });

    return readResponse<Event>(response);
  },

  async deleteEvent(sessionToken: string, eventId: string) {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(sessionToken)
    });

    return readResponse<void>(response);
  }
};
