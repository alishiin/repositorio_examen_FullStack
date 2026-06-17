/**
 * Tests api/client.js — mockeando fetch global.
 *
 * Cubre el helper `apiCall` (URL, headers, errores) y un sample de cada
 * grupo de endpoints (auth, pets, clinics, admin, health).
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('import.meta.env', () => ({ VITE_API_URL: 'http://bff.test/api' }));

import { authAPI, petsAPI, clinicsAPI, adminAPI, healthAPI } from '../client';

beforeEach(() => {
  globalThis.fetch = vi.fn();
  localStorage.clear();
});

const mockOk = (body) =>
  globalThis.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  });

const mockFail = (status = 500) =>
  globalThis.fetch.mockResolvedValue({
    ok: false,
    status,
    statusText: 'Boom',
    json: async () => ({}),
  });

describe('apiCall (via authAPI)', () => {
  test('login: POST con body JSON y sin auth header si no hay token', async () => {
    mockOk({ success: true });
    const res = await authAPI.login('a@b.com', 'pw');
    expect(res).toEqual({ success: true });
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.com', password: 'pw' });
    expect(opts.headers.Authorization).toBeUndefined();
  });

  test('agrega Authorization Bearer si hay authToken en storage', async () => {
    localStorage.setItem('authToken', 'tk-user');
    mockOk({});
    await authAPI.getProfile();
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tk-user');
  });

  test('adminToken tiene prioridad sobre authToken', async () => {
    localStorage.setItem('authToken', 'tk-user');
    localStorage.setItem('adminToken', 'tk-admin');
    mockOk({});
    await authAPI.getProfile();
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tk-admin');
  });

  test('lanza Error con status cuando response.ok=false', async () => {
    mockFail(404);
    await expect(authAPI.getProfile()).rejects.toThrow(/Error 404/);
  });

  test('propaga errores de red', async () => {
    globalThis.fetch.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(authAPI.getProfile()).rejects.toThrow('ECONNREFUSED');
  });
});

describe('petsAPI', () => {
  test('getMissing arma query string', async () => {
    mockOk([]);
    await petsAPI.getMissing({ type: 'perro' });
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/pets\/missing\?type=perro/);
  });

  test('getPetById construye URL correcta', async () => {
    mockOk({});
    await petsAPI.getPetById(42);
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/pets\/42$/);
  });

  test('reportPet POST con body', async () => {
    mockOk({});
    await petsAPI.reportPet({ name: 'Rex' });
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ name: 'Rex' });
  });

  test('updatePet PUT con body', async () => {
    mockOk({});
    await petsAPI.updatePet(5, { status: 'recovered' });
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.method).toBe('PUT');
  });
});

describe('clinicsAPI', () => {
  test('getClinics con filtros', async () => {
    mockOk([]);
    await clinicsAPI.getClinics({ lat: '1', lng: '2' });
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/clinics\?lat=1&lng=2/);
  });

  test('getClinicById', async () => {
    mockOk({});
    await clinicsAPI.getClinicById(7);
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/clinics\/7$/);
  });

  test('registerPetAtClinic POST', async () => {
    mockOk({});
    await clinicsAPI.registerPetAtClinic(1, { petId: 9 });
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/clinics\/1\/register-pet/);
    expect(opts.method).toBe('POST');
  });
});

describe('adminAPI', () => {
  test('login POST con username/password', async () => {
    mockOk({});
    await adminAPI.login('admin', 'admin');
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/admin\/login$/);
    expect(JSON.parse(opts.body)).toEqual({ username: 'admin', password: 'admin' });
  });

  test('getDashboard', async () => {
    mockOk({});
    await adminAPI.getDashboard();
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/admin\/dashboard/);
  });

  test('getPets con filtros', async () => {
    mockOk([]);
    await adminAPI.getPets({ status: 'pending' });
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/admin\/pets\?status=pending/);
  });

  test('approvePet PUT', async () => {
    mockOk({});
    await adminAPI.approvePet(5, 'ok');
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body)).toEqual({ notes: 'ok' });
  });

  test('rejectPet PUT', async () => {
    mockOk({});
    await adminAPI.rejectPet(5, 'mal');
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ reason: 'mal' });
  });

  test('recoverPet PUT', async () => {
    mockOk({});
    await adminAPI.recoverPet(5, 1, '2024-01-01');
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({
      clinicId: 1,
      recoveryDate: '2024-01-01',
    });
  });

  test('deletePet DELETE', async () => {
    mockOk({});
    await adminAPI.deletePet(99);
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('DELETE');
  });

  test('updatePetNotes PUT', async () => {
    mockOk({});
    await adminAPI.updatePetNotes(7, 'hola');
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ notes: 'hola' });
  });
});

describe('healthAPI', () => {
  test('check llama /health', async () => {
    mockOk({ status: 'ok' });
    const res = await healthAPI.check();
    expect(res).toEqual({ status: 'ok' });
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/\/health$/);
  });
});
