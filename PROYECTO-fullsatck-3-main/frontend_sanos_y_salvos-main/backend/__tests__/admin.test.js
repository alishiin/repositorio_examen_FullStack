/**
 * Tests de routes/admin.js — tests minimos: login (autocontenido) + auth middleware.
 * Los endpoints que llaman a GeoService/UserService quedan fuera de scope
 * porque requieren mockear `fetch` global Y fs.
 */
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import adminRouter from '../routes/admin.js';
import { makeApp } from './_helpers.js';

const app = makeApp(adminRouter, '/api/admin');

describe('POST /api/admin/login', () => {
  test('200 con admin/admin', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('admin-token-123');
  });

  test('401 con credenciales malas', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('401 sin credenciales', async () => {
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(401);
  });
});

describe('isAdmin middleware', () => {
  test('rechaza request sin token con 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rechaza token incorrecto', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer wrong-token');
    expect(res.status).toBe(401);
  });
});
