/**
 * Tests de routes/chat.js — endpoints sincronos, sin mocks.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import chatRouter from '../routes/chat.js';
import { makeApp } from './_helpers.js';

const app = makeApp(chatRouter, '/api/chat');

describe('GET /api/chat/config', () => {
  test('200 con wsUrl default', async () => {
    delete process.env.CHAT_SERVICE_URL;
    const res = await request(app).get('/api/chat/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.wsUrl).toBe('ws://localhost:8004');
  });

  test('respeta env CHAT_SERVICE_URL', async () => {
    process.env.CHAT_SERVICE_URL = 'wss://chat.prod.com';
    const res = await request(app).get('/api/chat/config');
    expect(res.body.wsUrl).toBe('wss://chat.prod.com');
    delete process.env.CHAT_SERVICE_URL;
  });
});

describe('GET /api/chat/room/:roomName/validate', () => {
  test('200 con room data', async () => {
    const res = await request(app).get('/api/chat/room/sala-perros/validate');
    expect(res.status).toBe(200);
    expect(res.body.authorized).toBe(true);
    expect(res.body.room).toBe('sala-perros');
    expect(res.body.wsEndpoint).toContain('/ws/chat/sala-perros/');
  });

  test('tolera trailing slash', async () => {
    const res = await request(app).get('/api/chat/room/sala-x/validate/');
    expect(res.status).toBe(200);
    expect(res.body.room).toBe('sala-x');
  });
});
