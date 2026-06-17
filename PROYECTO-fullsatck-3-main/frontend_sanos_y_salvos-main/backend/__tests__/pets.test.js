/**
 * Tests de routes/pets.js — endpoints stub, sin dependencias externas.
 */
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import petsRouter from '../routes/pets.js';
import { makeApp } from './_helpers.js';

const app = makeApp(petsRouter, '/api/pets');

describe('GET /api/pets/missing', () => {
  test('200 con lista', async () => {
    const res = await request(app).get('/api/pets/missing');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/pets/report', () => {
  test('201 con datos validos', async () => {
    const res = await request(app)
      .post('/api/pets/report')
      .send({ name: 'Rex', type: 'Perro', location: { lat: 1, lng: 1 } });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.petId).toEqual(expect.any(Number));
  });

  test('400 sin nombre', async () => {
    const res = await request(app)
      .post('/api/pets/report')
      .send({ type: 'Perro', location: { lat: 1, lng: 1 } });
    expect(res.status).toBe(400);
  });

  test('400 sin location', async () => {
    const res = await request(app)
      .post('/api/pets/report')
      .send({ name: 'Rex', type: 'Perro' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/pets/:id', () => {
  test('200 con datos de la mascota', async () => {
    const res = await request(app).get('/api/pets/42');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('42');
  });
});

describe('PUT /api/pets/:id', () => {
  test('200 actualiza status', async () => {
    const res = await request(app)
      .put('/api/pets/42')
      .send({ status: 'recovered' });
    expect(res.status).toBe(200);
    expect(res.body.newStatus).toBe('recovered');
  });
});
