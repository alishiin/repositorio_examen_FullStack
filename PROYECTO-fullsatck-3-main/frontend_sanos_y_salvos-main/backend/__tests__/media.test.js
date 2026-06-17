/**
 * Tests de routes/media.js — mismo patron que match.test.js (proxy mockeado).
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

const { default: mediaRouter } = await import('../routes/media.js');
const { makeApp } = await import('./_helpers.js');

const errorHandler = fakeProxy.on.mock.calls.find(([ev]) => ev === 'error')[1];

const app = makeApp(mediaRouter, '/api/media');

beforeEach(() => {
  fakeProxy.web.mockClear();
});

describe('POST /api/media/upload (proxy)', () => {
  test('reescribe URL y reenvia al target', (done) => {
    fakeProxy.web.mockImplementation((req, res, opts) => {
      expect(req.url).toBe('/api/media/upload/');
      expect(opts.target).toBe(
        process.env.MEDIA_SERVICE_URL || 'http://localhost:8006',
      );
      res.status(201).json({ id: 'fake-uuid', proxied: true });
    });
    request(app)
      .post('/api/media/upload')
      .send({ foo: 'bar' })
      .expect(201)
      .end((err) => {
        if (err) return done(err);
        expect(fakeProxy.web).toHaveBeenCalledTimes(1);
        done();
      });
  });
});

describe('Error handler del proxy de Media', () => {
  test('devuelve 503 con mensaje claro', () => {
    expect(errorHandler).toBeDefined();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    errorHandler(new Error('boom'), {}, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Media Service'),
      }),
    );
  });
});
