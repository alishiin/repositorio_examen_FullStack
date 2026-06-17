/**
 * Pruebas Unitarias - API Client (Frontend - Facade Pattern)
 * 
 * Testing de:
 * - Facade pattern (encapsulación de endpoints)
 * - Inyección automática de headers
 * - Manejo de errores
 * 
 * Ejecutar: npm test -- api/client.test.js
 */

// Mock de fetch global
global.fetch = jest.fn();

// Función del Facade Pattern
const createApiClient = () => {
  const getHeaders = (token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = getHeaders(token);
    const mergedOptions = { ...options, headers };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, mergedOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  return {
    authAPI: {
      login: (credentials) =>
        apiCall('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        }),
      register: (userData) =>
        apiCall('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        }),
      logout: () =>
        apiCall('/api/auth/logout', { method: 'POST' }),
      profile: () => apiCall('/api/auth/profile')
    },
    petsAPI: {
      getAll: () => apiCall('/api/pets'),
      getMissing: (lat, lng, radius) =>
        apiCall(`/api/pets/missing?lat=${lat}&lng=${lng}&radius=${radius}`),
      getFound: (lat, lng, radius) =>
        apiCall(`/api/pets/found?lat=${lat}&lng=${lng}&radius=${radius}`),
      report: (reportData) =>
        apiCall('/api/pets/report', {
          method: 'POST',
          body: JSON.stringify(reportData)
        })
    },
    clinicsAPI: {
      getAll: () => apiCall('/api/clinics'),
      getById: (id) => apiCall(`/api/clinics/${id}`)
    }
  };
};

// ============================================
// PRUEBAS UNITARIAS
// ============================================

describe('API Client - Facade Pattern', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.localStorage = mockLocalStorage;
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('authAPI.login', () => {
    test('debe hacer POST a /api/auth/login con credenciales', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'jwt-token-123',
          user: { id: 1, email: 'user@example.com' }
        })
      });

      const client = createApiClient();
      const result = await client.authAPI.login({
        email: 'user@example.com',
        password: 'password123'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-123');
    });

    test('debe inyectar token de autenticación en headers si existe', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      mockLocalStorage.getItem.mockReturnValue('existing-token-xyz');

      const client = createApiClient();
      await client.petsAPI.getAll();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer existing-token-xyz'
          })
        })
      );
    });

    test('debe lanzar error si la respuesta no es ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const client = createApiClient();
      await expect(
        client.authAPI.login({
          email: 'user@example.com',
          password: 'wrong'
        })
      ).rejects.toThrow();
    });
  });

  describe('authAPI.register', () => {
    test('debe hacer POST a /api/auth/register con datos de usuario', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 2, email: 'newuser@example.com', name: 'New User' }
        })
      });

      const client = createApiClient();
      const result = await client.authAPI.register({
        email: 'newuser@example.com',
        password: 'password12345',
        name: 'New User'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('newuser@example.com');
    });
  });

  describe('petsAPI', () => {
    test('debe obtener todas las mascotas', async () => {
      const mockPets = [
        { id: 1, name: 'Perro 1', type: 'perro' },
        { id: 2, name: 'Gato 1', type: 'gato' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPets,
          count: 2
        })
      });

      const client = createApiClient();
      const result = await client.petsAPI.getAll();

      expect(result.data.length).toBe(2);
      expect(result.count).toBe(2);
    });

    test('debe obtener mascotas perdidas con proximidad', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          count: 0
        })
      });

      const client = createApiClient();
      await client.petsAPI.getMissing(-33.4489, -70.6693, 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pets/missing?lat=-33.4489&lng=-70.6693&radius=5'),
        expect.any(Object)
      );
    });

    test('debe reportar mascota perdida/encontrada', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 5, name: 'Perro Perdido' }
        })
      });

      const client = createApiClient();
      const result = await client.petsAPI.report({
        name: 'Perro Perdido',
        type: 'perro',
        reportType: 'missing',
        lat: -33.4489,
        lng: -70.6693
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pets/report'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('clinicsAPI', () => {
    test('debe obtener todas las clínicas', async () => {
      const mockClinics = [
        { id: 1, name: 'Clínica 1', phone: '+56912345678' },
        { id: 2, name: 'Clínica 2', phone: '+56987654321' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockClinics
        })
      });

      const client = createApiClient();
      const result = await client.clinicsAPI.getAll();

      expect(result.data.length).toBe(2);
    });

    test('debe obtener clínica por ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 1, name: 'Clínica 1' }
        })
      });

      const client = createApiClient();
      const result = await client.clinicsAPI.getById(1);

      expect(result.data.id).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/clinics/1',
        expect.any(Object)
      );
    });
  });
});

describe('Error Handling - Facade Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('debe manejar errores de conexión', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const client = createApiClient();

    await expect(client.petsAPI.getAll()).rejects.toThrow('Network error');
  });

  test('debe loguear errores en consola', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const client = createApiClient();

    try {
      await client.authAPI.login({
        email: 'user@example.com',
        password: 'password'
      });
    } catch (e) {
      // Esperamos error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
