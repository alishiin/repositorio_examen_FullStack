/**
 * Tests de routes/admin.js — login + auth middleware + PUT /pets/:id (mock fetch).
 * Los endpoints que leen GeoService/UserService quedan fuera de scope
 * porque requieren mockear `fetch` global Y fs de forma mas compleja.
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import adminRouter from '../routes/admin.js';
import { makeApp } from './_helpers.js';

const app = makeApp(adminRouter, '/api/admin');
const ADMIN_TOKEN = 'admin-token-123';

describe('POST /api/admin/login', () => {
  test('200 con admin/admin', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' });
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

describe('PUT /api/admin/pets/:id', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('400 cuando el body no trae campos editables', async () => {
    const res = await request(app)
      .put('/api/admin/pets/123')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ campo_no_permitido: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/campos para actualizar/);
  });

  test('400 cuando tipo_reporte es invalido', async () => {
    const res = await request(app)
      .put('/api/admin/pets/123')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ tipo_reporte: 'perdida' }); // femenino — invalido
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tipo_reporte/);
  });

  test('400 cuando estado es invalido', async () => {
    const res = await request(app)
      .put('/api/admin/pets/123')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ estado: 'pendiente' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/estado/);
  });

  test('200 con campos validos llama a GeoService con PATCH', async () => {
    const mockResponse = { id: 123, titulo: 'Nuevo titulo', estado: 'resuelto' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const res = await request(app)
      .put('/api/admin/pets/123')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ titulo: 'Nuevo titulo', estado: 'resuelto', tipo_reporte: 'encontrado' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/ubicaciones\/123\/$/);
    expect(opts.method).toBe('PATCH');
    const body = JSON.parse(opts.body);
    expect(body.titulo).toBe('Nuevo titulo');
    expect(body.estado).toBe('resuelto');
    expect(body.tipo_reporte).toBe('encontrado');
  });

  test('500 cuando GeoService responde con error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found'
    });

    const res = await request(app)
      .put('/api/admin/pets/999')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ estado: 'cerrado' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('rechaza request sin token con 401', async () => {
    const res = await request(app)
      .put('/api/admin/pets/123')
      .send({ estado: 'activo' });
    expect(res.status).toBe(401);
  });
});
