/**
 * Tests de routes/match.js — mockeando http-proxy via ESM.
 *
 * El proxy.web() siempre se llama; verificamos que recibe el target y la URL reescrita.
 * El handler de error se captura via proxy.on('error', ...) y se invoca manualmente
 * para validar la respuesta 503.
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

const fakeProxy = {
  on: jest.fn(),
  web: jest.fn(),
};

jest.unstable_mockModule('http-proxy', () => ({
  default: {
    createProxyServer: jest.fn(() => fakeProxy),
  },
}));

const { default: matchRouter } = await import('../routes/match.js');
const { makeApp } = await import('./_helpers.js');

// Capturar el handler de error registrado durante el import.
const errorHandler = fakeProxy.on.mock.calls.find(([ev]) => ev === 'error')[1];

const app = makeApp(matchRouter, '/api/match');

beforeEach(() => {
  fakeProxy.web.mockClear();
});

describe('POST /api/match/analyze (proxy)', () => {
  test('reescribe URL a /api/match/analyze/ y reenvia al target', (done) => {
    fakeProxy.web.mockImplementation((req, res, opts) => {
      // Validaciones in-line del proxy call.
      expect(req.url).toBe('/api/match/analyze/');
      expect(opts.target).toBe(
        process.env.MATCH_SERVICE_URL || 'http://localhost:8005',
      );
      res.status(202).json({ ok: true, proxied: true });
    });
    request(app)
      .post('/api/match/analyze')
      .send({ foo: 'bar' })
      .expect(202)
      .end((err, res) => {
        if (err) return done(err);
        expect(fakeProxy.web).toHaveBeenCalledTimes(1);
        done();
      });
  });
});

describe('Manejo de errores del proxy', () => {
  test('el handler de error devuelve 503', () => {
    expect(errorHandler).toBeDefined();
    // Mock de req y res.
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    errorHandler(new Error('connect ECONNREFUSED'), req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Match Service'),
      }),
    );
  });
});
