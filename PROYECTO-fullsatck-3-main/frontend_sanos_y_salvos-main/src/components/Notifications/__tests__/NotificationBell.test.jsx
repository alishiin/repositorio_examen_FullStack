/**
 * Tests NotificationBell — verifica render condicional segun user/unread.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock de hooks. (No usamos los hooks reales: tests aislados por componente.)
const mockUser = { id: 7, name: 'Alice' };
let currentNotifs = [];
let currentUnread = 0;
const fetchSpy = vi.fn();
const markReadSpy = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: currentNotifs,
    unreadCount: currentUnread,
    fetchNotifications: fetchSpy,
    markAsRead: markReadSpy,
  }),
}));

import NotificationBell from '../NotificationBell';

beforeEach(() => {
  currentNotifs = [];
  currentUnread = 0;
  fetchSpy.mockReset();
  markReadSpy.mockReset();
});

describe('NotificationBell', () => {
  test('llama a fetchNotifications al montar con el userId', async () => {
    render(<NotificationBell />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(7));
  });

  test('no muestra badge si unreadCount es 0', () => {
    render(<NotificationBell />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('muestra badge con unreadCount > 0', () => {
    currentUnread = 3;
    render(<NotificationBell />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('abre dropdown al hacer click en la campana', () => {
    currentUnread = 2;
    currentNotifs = [
      { id: 1, title: 't1', message: 'm1', created_at: '2024-01-01', read: false },
    ];
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('t1')).toBeInTheDocument();
  });

  test('estado vacio dentro del dropdown', () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText(/No tienes notificaciones/)).toBeInTheDocument();
  });

  test('click en notif unread llama markAsRead', () => {
    currentNotifs = [
      { id: 5, title: 'foo', message: 'bar', created_at: '2024-01-01', read: false },
    ];
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    fireEvent.click(screen.getByText('foo'));
    expect(markReadSpy).toHaveBeenCalledWith(5);
  });

  test('click en notif read NO llama markAsRead', () => {
    currentNotifs = [
      { id: 5, title: 'foo', message: 'bar', created_at: '2024-01-01', read: true },
    ];
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    fireEvent.click(screen.getByText('foo'));
    expect(markReadSpy).not.toHaveBeenCalled();
  });
});
