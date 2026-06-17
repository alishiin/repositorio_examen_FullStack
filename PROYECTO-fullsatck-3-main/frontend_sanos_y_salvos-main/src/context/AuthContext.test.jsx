/**
 * Pruebas Unitarias - AuthContext (Frontend)
 * 
 * Testing de:
 * - Persistencia de estado en localStorage
 * - Funciones de login/logout
 * - Observer pattern (useEffect)
 * 
 * Ejecutar: npm test -- AuthContext.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// ============================================
// COMPONENTE DE PRUEBA
// ============================================

const TestComponent = () => {
  const { isLoggedIn, user, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="login-status">
        {isLoggedIn ? 'Logged In' : 'Logged Out'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button
        data-testid="login-btn"
        onClick={() =>
          login({
            email: 'test@example.com',
            name: 'Test User',
            token: 'test-token-123'
          })
        }
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

// ============================================
// PRUEBAS UNITARIAS
// ============================================

describe('AuthContext - Provider Pattern', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('debe iniciar con usuario no autenticado', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const status = screen.getByTestId('login-status');
    expect(status.textContent).toBe('Logged Out');
  });

  test('debe actualizar estado al hacer login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      const status = screen.getByTestId('login-status');
      expect(status.textContent).toBe('Logged In');
    });
  });

  test('debe guardar token en localStorage al hacer login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'authToken',
        expect.stringContaining('test-token-123')
      );
    });
  });

  test('debe mostrar email del usuario después del login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      const userEmail = screen.getByTestId('user-email');
      expect(userEmail.textContent).toBe('test@example.com');
    });
  });

  test('debe limpiar estado al hacer logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      const status = screen.getByTestId('login-status');
      expect(status.textContent).toBe('Logged In');
    });

    // Logout
    const logoutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      const status = screen.getByTestId('login-status');
      expect(status.textContent).toBe('Logged Out');
    });
  });

  test('debe remover token de localStorage al hacer logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    // Logout
    const logoutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });
});

describe('AuthContext - Observer Pattern (useEffect)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('debe restaurar sesión desde localStorage al montar', () => {
    const userData = JSON.stringify({
      email: 'persisted@example.com',
      name: 'Persisted User'
    });

    localStorageMock.setItem('authToken', 'persisted-token-123');
    localStorageMock.setItem('user', userData);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar que lee del localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
  });

  test('debe mantener sesión activa entre renders', async () => {
    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('login-status').textContent).toBe('Logged In');
    });

    // Re-render
    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Debe seguir logged in
    expect(screen.getByTestId('login-status').textContent).toBe('Logged In');
  });
});

describe('Patrón Context API', () => {
  test('debe proporcionar authToken correctamente', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
