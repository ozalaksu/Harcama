import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../createApp.js';
import { InMemoryStore } from '../storage/inMemoryStore.js';

describe('expense app API', () => {
  it('rejects invalid passwords', async () => {
    const app = createApp({
      authPassword: '918273',
      sessionDurationDays: 30,
      store: new InMemoryStore()
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid password');
  });

  it('creates a session and returns events for authenticated requests', async () => {
    const app = createApp({
      authPassword: '918273',
      sessionDurationDays: 30,
      store: new InMemoryStore()
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ password: '918273' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.sessionToken).toEqual(expect.any(String));

    const eventsResponse = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${loginResponse.body.sessionToken}`);

    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.body).toEqual([]);
  });

  it('creates, updates and deletes an event for authenticated users', async () => {
    const app = createApp({
      authPassword: '918273',
      sessionDurationDays: 30,
      store: new InMemoryStore()
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ password: '918273' });

    const sessionToken = loginResponse.body.sessionToken as string;

    const createdEvent = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: 'Yaz Tatili',
        participants: [{ id: 'p1', name: 'Ali' }],
        expenses: [],
        date: '2026-07-27T10:00:00.000Z'
      });

    expect(createdEvent.status).toBe(201);
    expect(createdEvent.body.title).toBe('Yaz Tatili');

    const updatedEvent = await request(app)
      .put(`/api/events/${createdEvent.body.id}`)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        ...createdEvent.body,
        participants: [
          { id: 'p1', name: 'Ali' },
          { id: 'p2', name: 'Ayse' }
        ]
      });

    expect(updatedEvent.status).toBe(200);
    expect(updatedEvent.body.participants).toHaveLength(2);

    const deleteResponse = await request(app)
      .delete(`/api/events/${createdEvent.body.id}`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(deleteResponse.status).toBe(204);

    const eventsResponse = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(eventsResponse.body).toEqual([]);
  });
});
