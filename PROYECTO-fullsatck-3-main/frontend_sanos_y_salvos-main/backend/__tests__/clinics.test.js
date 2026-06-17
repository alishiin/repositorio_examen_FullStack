/**
 * Tests de routes/clinics.js — endpoints stub, sin mocks.
 */
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import clinicsRouter from '../routes/clinics.js';
import { makeApp } from './_helpers.js';

const app = makeApp(clinicsRouter, '/api/clinics');

describe('GET /api/clinics', () => {
  test('200 con lista', async () => {
    const res = await request(app).get('/api/clinics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('acepta query params lat/lng/radius', async () => {
    const res = await request(app).get('/api/clinics?lat=4.7&lng=-74.0&radius=5');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/clinics/:id', () => {
  test('200 con detalle', async () => {
    const res = await request(app).get('/api/clinics/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('1');
    expect(res.body.data.veterinarians).toBeDefined();
  });
});

describe('POST /api/clinics/:id/register-pet', () => {
  test('201 con datos', async () => {
    const res = await request(app)
      .post('/api/clinics/1/register-pet')
      .send({ petId: 5, petName: 'Rex', ownerName: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.registrationId).toEqual(expect.any(Number));
  });
});
