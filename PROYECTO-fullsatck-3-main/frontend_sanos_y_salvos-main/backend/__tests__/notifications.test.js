/**
 * Tests de routes/notifications.js — mockeando axios via ESM.
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

// Mock axios ANTES del import.
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const { default: axios } = await import('axios');
const { default: notifRouter } = await import('../routes/notifications.js');
const { makeApp } = await import('./_helpers.js');

const app = makeApp(notifRouter, '/api/notifications');

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
});

describe('GET /api/notifications/?user_id=X', () => {
  test('200 reenvia respuesta del notif service', async () => {
    axios.get.mockResolvedValue({
      status: 200,
      data: [{ id: 1, title: 'foo', user_id: 5 }],
    });
    const res = await request(app).get('/api/notifications/?user_id=5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, title: 'foo', user_id: 5 }]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/'),
      expect.objectContaining({ params: { user_id: '5' } }),
    );
  });

  test('400 sin user_id', async () => {
    const res = await request(app).get('/api/notifications/');
    expect(res.status).toBe(400);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('500 cuando axios falla sin response', async () => {
    axios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await request(app).get('/api/notifications/?user_id=5');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('propaga status del upstream cuando error.response.status existe', async () => {
    axios.get.mockRejectedValue({
      message: 'Not found',
      response: { status: 404, data: { error: 'user not found' } },
    });
    const res = await request(app).get('/api/notifications/?user_id=999');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('user not found');
  });
});

describe('POST /api/notifications/:id/mark-read', () => {
  test('200 reenvia respuesta', async () => {
    axios.post.mockResolvedValue({
      status: 200,
      data: { id: 5, read: true },
    });
    const res = await request(app).post('/api/notifications/5/mark-read');
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  test('404 cuando upstream 404', async () => {
    axios.post.mockRejectedValue({
      message: 'not found',
      response: { status: 404, data: { error: 'no existe' } },
    });
    const res = await request(app).post('/api/notifications/999/mark-read');
    expect(res.status).toBe(404);
  });

  test('500 cuando axios falla sin response', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    const res = await request(app).post('/api/notifications/5/mark-read');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/notifications/trigger-match', () => {
  const validPayload = {
    user_id: 1,
    user_email: 'a@b.com',
    match_id: 99,
    pet_name: 'Rex',
  };

  test('200 OK', async () => {
    axios.post.mockResolvedValue({ status: 200, data: { success: true, notification_id: 7 } });
    const res = await request(app)
      .post('/api/notifications/trigger-match')
      .send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 sin user_id', async () => {
    const { user_id, ...bad } = validPayload;
    const res = await request(app)
      .post('/api/notifications/trigger-match')
      .send(bad);
    expect(res.status).toBe(400);
  });

  test('400 sin user_email', async () => {
    const { user_email, ...bad } = validPayload;
    const res = await request(app)
      .post('/api/notifications/trigger-match')
      .send(bad);
    expect(res.status).toBe(400);
  });

  test('upstream 500 se propaga', async () => {
    axios.post.mockRejectedValue({
      message: 'boom',
      response: { status: 500, data: { error: 'gemini muerto' } },
    });
    const res = await request(app)
      .post('/api/notifications/trigger-match')
      .send(validPayload);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('gemini muerto');
  });

  test('500 cuando axios falla sin response', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await request(app)
      .post('/api/notifications/trigger-match')
      .send(validPayload);
    expect(res.status).toBe(500);
  });
});
