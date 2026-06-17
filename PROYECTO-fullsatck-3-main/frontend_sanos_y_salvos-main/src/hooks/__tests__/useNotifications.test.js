/**
 * Tests useNotifications.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  notificationsServiceClient: {
    listNotifications: vi.fn(),
    markAsRead: vi.fn(),
    triggerMatchNotification: vi.fn(),
  },
}));

import { notificationsServiceClient } from '../../services/api';
import useNotifications from '../useNotifications';

beforeEach(() => {
  notificationsServiceClient.listNotifications.mockReset();
  notificationsServiceClient.markAsRead.mockReset();
  notificationsServiceClient.triggerMatchNotification.mockReset();
});

describe('useNotifications', () => {
  test('estado inicial', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  test('fetchNotifications ok (lista pura)', async () => {
    notificationsServiceClient.listNotifications.mockResolvedValue([
      { id: 1, title: 't', read: false },
      { id: 2, title: 't2', read: true },
    ]);
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.fetchNotifications(5);
    });
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  test('fetchNotifications con respuesta paginada {results}', async () => {
    notificationsServiceClient.listNotifications.mockResolvedValue({
      results: [{ id: 1, read: false }],
    });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.fetchNotifications(5);
    });
    expect(result.current.notifications).toHaveLength(1);
  });

  test('fetchNotifications sin userId devuelve []', async () => {
    const { result } = renderHook(() => useNotifications());
    let returned;
    await act(async () => {
      returned = await result.current.fetchNotifications(null);
    });
    expect(returned).toEqual([]);
    expect(notificationsServiceClient.listNotifications).not.toHaveBeenCalled();
  });

  test('fetchNotifications maneja error', async () => {
    notificationsServiceClient.listNotifications.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useNotifications());
    let returned;
    await act(async () => {
      returned = await result.current.fetchNotifications(5);
    });
    expect(returned).toEqual([]);
    expect(result.current.error).toBe('boom');
  });

  test('markAsRead actualiza el state de manera optimista', async () => {
    notificationsServiceClient.listNotifications.mockResolvedValue([
      { id: 1, read: false },
      { id: 2, read: false },
    ]);
    notificationsServiceClient.markAsRead.mockResolvedValue({ id: 1, read: true });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.fetchNotifications(5);
    });
    expect(result.current.unreadCount).toBe(2);
    await act(async () => {
      await result.current.markAsRead(1);
    });
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications.find((n) => n.id === 1).read).toBe(true);
  });

  test('markAsRead sin id no llama API', async () => {
    const { result } = renderHook(() => useNotifications());
    let returned;
    await act(async () => {
      returned = await result.current.markAsRead(null);
    });
    expect(returned).toBeNull();
    expect(notificationsServiceClient.markAsRead).not.toHaveBeenCalled();
  });

  test('markAsRead propaga error', async () => {
    notificationsServiceClient.markAsRead.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await expect(result.current.markAsRead(1)).rejects.toThrow('500');
    });
    expect(result.current.error).toBe('500');
  });

  test('sendNotification ok', async () => {
    notificationsServiceClient.triggerMatchNotification.mockResolvedValue({
      success: true,
      notification_id: 99,
    });
    const { result } = renderHook(() => useNotifications());
    let returned;
    await act(async () => {
      returned = await result.current.sendNotification(1, 'a@b.com', 5, 'Rex');
    });
    expect(returned.success).toBe(true);
    expect(result.current.notificationSent).toEqual(returned);
  });

  test('sendNotification valida parametros faltantes', async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await expect(
        result.current.sendNotification(null, 'a@b.com', 5, 'Rex'),
      ).rejects.toThrow(/Faltan/);
    });
  });

  test('sendNotification valida email invalido', async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await expect(
        result.current.sendNotification(1, 'no-email', 5, 'Rex'),
      ).rejects.toThrow(/Email/);
    });
  });

  test('sendNotification lanza si API retorna success:false', async () => {
    notificationsServiceClient.triggerMatchNotification.mockResolvedValue({
      success: false,
      error: 'invalid',
    });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await expect(
        result.current.sendNotification(1, 'a@b.com', 5, 'Rex'),
      ).rejects.toThrow('invalid');
    });
  });
});
