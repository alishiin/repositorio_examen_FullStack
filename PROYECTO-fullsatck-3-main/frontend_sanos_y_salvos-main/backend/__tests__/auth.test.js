/**
 * Tests de routes/auth.js — endpoints stub puros, sin mocks externos.
 */
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import authRouter from '../routes/auth.js';
import { makeApp } from './_helpers.js';

const app = makeApp(authRouter, '/api/auth');

describe('POST /api/auth/login', () => {
  test('200 con email + password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('jwt-token-ejemplo');
    expect(res.body.user.email).toBe('a@b.com');
  });

  test('400 sin email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 sin password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  test('200 con email, password, name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'secret', name: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Alice');
  });

  test('400 sin name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'secret' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  test('200 OK', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/profile', () => {
  test('200 OK con user data', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBeDefined();
    expect(res.body.user.name).toBeDefined();
  });
});
