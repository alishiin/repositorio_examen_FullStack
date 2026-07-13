/**
 * Tests de routes/profiles.js — autorización admin y mutaciones básicas.
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import profilesRouter from '../routes/profiles.js';
import { makeApp } from './_helpers.js';

const app = makeApp(profilesRouter, '/api/profiles');
const ADMIN_TOKEN = 'admin-token-123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const PROFILE_FILE = path.join(DATA_DIR, 'institution-profiles.json');

let originalStore = null;

beforeAll(() => {
  if (fs.existsSync(PROFILE_FILE)) {
    originalStore = fs.readFileSync(PROFILE_FILE, 'utf-8');
  }
});

afterAll(() => {
  if (originalStore !== null) {
    fs.writeFileSync(PROFILE_FILE, originalStore, 'utf-8');
  }
});

describe('GET /api/profiles/:type', () => {
  test('retorna perfil veterinaria por defecto', async () => {
    const res = await request(app).get('/api/profiles/veterinaria');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('veterinaria');
  });
});

describe('perfil institucional admin-only', () => {
  test('rechaza update sin token', async () => {
    const res = await request(app)
      .put('/api/profiles/veterinaria')
      .send({ name: 'Cambio no autorizado' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('permite update con token admin', async () => {
    const res = await request(app)
      .put('/api/profiles/veterinaria')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ name: 'Perfil Veterinaria QA' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Perfil Veterinaria QA');
  });

  test('rechaza delete sin token admin', async () => {
    const res = await request(app).delete('/api/profiles/veterinaria');
    expect(res.status).toBe(403);
  });

  test('permite delete con token admin', async () => {
    const res = await request(app)
      .delete('/api/profiles/veterinaria')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});