/**
 * Tests AuthContext + useAuth hook.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth';

// Componente sonda que expone el contexto.
function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user ? auth.user.name : 'none'}</span>
      <span data-testid="token">{auth.token || 'no-token'}</span>
      <button onClick={() => auth.login({ name: 'Alice', id: 1 }, 'tk-123')}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => auth.updateUser({ name: 'Alice2', id: 1 })}>update</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('AuthProvider', () => {
  test('estado inicial sin datos en storage', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('authed').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  test('hidrata desde localStorage si hay datos validos', () => {
    localStorage.setItem('authToken', 'stored-tk');
    localStorage.setItem('user', JSON.stringify({ name: 'Bob', id: 9 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('authed').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('Bob');
    expect(screen.getByTestId('token').textContent).toBe('stored-tk');
  });

  test('storage corrupto se limpia y deja loguead-out', () => {
    localStorage.setItem('authToken', 'tk');
    localStorage.setItem('user', '{not json');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('authed').textContent).toBe('false');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('login persiste user + token en storage', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    act(() => {
      screen.getByText('login').click();
    });
    expect(screen.getByTestId('authed').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('Alice');
    expect(localStorage.getItem('authToken')).toBe('tk-123');
  });

  test('logout limpia storage y estado', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    act(() => screen.getByText('login').click());
    act(() => screen.getByText('logout').click());
    expect(screen.getByTestId('authed').textContent).toBe('false');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  test('updateUser actualiza solo user', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    act(() => screen.getByText('login').click());
    act(() => screen.getByText('update').click());
    expect(screen.getByTestId('user').textContent).toBe('Alice2');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Alice2');
  });
});

describe('useAuth hook (fuera del provider)', () => {
  test('lanza Error claro cuando se usa sin AuthProvider', () => {
    const Bad = () => {
      useAuth();
      return null;
    };
    // React 19 captura errores de render; usamos try/catch + un error boundary trivial.
    expect(() => render(<Bad />)).toThrow(/AuthProvider/);
  });
});
