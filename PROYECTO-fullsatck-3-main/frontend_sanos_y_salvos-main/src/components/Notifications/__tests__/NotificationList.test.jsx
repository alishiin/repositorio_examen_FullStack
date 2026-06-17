/**
 * Tests NotificationList — vista expandida en /cuenta.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let currentState = {
  notifications: [],
  loading: false,
  error: null,
};
const fetchSpy = vi.fn();
const markReadSpy = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 7 } }),
}));

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    ...currentState,
    fetchNotifications: fetchSpy,
    markAsRead: markReadSpy,
  }),
}));

import NotificationList from '../NotificationList';

beforeEach(() => {
  currentState = { notifications: [], loading: false, error: null };
  fetchSpy.mockReset();
  markReadSpy.mockReset();
});

describe('NotificationList', () => {
  test('muestra loading', () => {
    currentState = { ...currentState, loading: true };
    render(<NotificationList />);
    expect(screen.getByText(/Cargando notificaciones/)).toBeInTheDocument();
  });

  test('muestra error', () => {
    currentState = { ...currentState, error: 'algo fallo' };
    render(<NotificationList />);
    expect(screen.getByText('algo fallo')).toBeInTheDocument();
  });

  test('muestra estado vacio', () => {
    render(<NotificationList />);
    expect(screen.getByText(/No tienes notificaciones aun/)).toBeInTheDocument();
  });

  test('renderiza lista de notificaciones', () => {
    currentState = {
      ...currentState,
      notifications: [
        {
          id: 1,
          title: 'Match!',
          message: 'Tu perro fue encontrado',
          notification_type: 'match',
          created_at: '2024-06-01T10:00:00Z',
          read: false,
        },
        {
          id: 2,
          title: 'Comentario',
          message: 'Alguien comento',
          notification_type: 'comment',
          created_at: '2024-06-02T10:00:00Z',
          read: true,
        },
      ],
    };
    render(<NotificationList />);
    expect(screen.getByText('Match!')).toBeInTheDocument();
    expect(screen.getByText('Comentario')).toBeInTheDocument();
    // boton marcar como leida solo aparece en la unread.
    const botones = screen.getAllByRole('button', { name: /Marcar como leida/i });
    expect(botones).toHaveLength(1);
  });

  test('click en marcar como leida invoca markAsRead', () => {
    currentState = {
      ...currentState,
      notifications: [
        {
          id: 99,
          title: 't',
          message: 'm',
          notification_type: 'match',
          created_at: '2024-06-01T10:00:00Z',
          read: false,
        },
      ],
    };
    render(<NotificationList />);
    fireEvent.click(screen.getByRole('button', { name: /Marcar como leida/i }));
    expect(markReadSpy).toHaveBeenCalledWith(99);
  });
});
