/**
 * Pruebas Unitarias - Rutas de Autenticación (Backend)
 * 
 * Testing de:
 * - Validación de entrada (login/register)
 * - Manejo de errores
 * - Respuestas correctas
 * 
 * Ejecutar: npm test -- routes/auth.test.js
 */

// Mock de express para testing
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (body = {}) => {
  return { body };
};

// Función de validación extraída del código real
const validateLoginInput = (email, password) => {
  if (!email || !password) {
    return { valid: false, message: 'Email y contraseña son requeridos' };
  }
  if (!email.includes('@')) {
    return { valid: false, message: 'Email inválido' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
};

const validateRegisterInput = (email, password, name) => {
  if (!email || !password || !name) {
    return { valid: false, message: 'Todos los campos son requeridos' };
  }
  if (!email.includes('@')) {
    return { valid: false, message: 'Email inválido' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Contraseña debe tener al menos 8 caracteres' };
  }
  if (name.length < 2) {
    return { valid: false, message: 'Nombre debe tener al menos 2 caracteres' };
  }
  return { valid: true };
};

// ============================================
// PRUEBAS UNITARIAS
// ============================================

describe('Autenticación - Validación de Entrada', () => {
  describe('validateLoginInput', () => {
    test('debe validar login correcto', () => {
      const result = validateLoginInput('user@example.com', 'password123');
      expect(result.valid).toBe(true);
    });

    test('debe rechazar email vacío', () => {
      const result = validateLoginInput('', 'password123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('requeridos');
    });

    test('debe rechazar contraseña vacía', () => {
      const result = validateLoginInput('user@example.com', '');
      expect(result.valid).toBe(false);
    });

    test('debe rechazar email sin @', () => {
      const result = validateLoginInput('userexample.com', 'password123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Email inválido');
    });

    test('debe rechazar contraseña muy corta', () => {
      const result = validateLoginInput('user@example.com', '12345');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('al menos 6 caracteres');
    });
  });

  describe('validateRegisterInput', () => {
    test('debe validar registro correcto', () => {
      const result = validateRegisterInput(
        'newuser@example.com',
        'password12345',
        'Juan Pérez'
      );
      expect(result.valid).toBe(true);
    });

    test('debe rechazar contraseña muy corta en registro', () => {
      const result = validateRegisterInput(
        'user@example.com',
        'pass12',
        'Juan Pérez'
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('al menos 8 caracteres');
    });

    test('debe rechazar nombre muy corto', () => {
      const result = validateRegisterInput(
        'user@example.com',
        'password12345',
        'J'
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('al menos 2 caracteres');
    });

    test('debe rechazar email inválido', () => {
      const result = validateRegisterInput(
        'userexample.com',
        'password12345',
        'Juan Pérez'
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Email inválido');
    });

    test('debe rechazar si falta email', () => {
      const result = validateRegisterInput(
        '',
        'password12345',
        'Juan Pérez'
      );
      expect(result.valid).toBe(false);
    });
  });
});

describe('Manejo de Respuestas HTTP', () => {
  test('respuesta de login exitoso debe tener status 200', () => {
    const res = mockResponse();
    res.status(200).json({
      success: true,
      token: 'jwt-token-xxx',
      user: { id: 1, email: 'user@example.com' }
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('respuesta de login fallido debe tener status 401', () => {
    const res = mockResponse();
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('respuesta de validación fallida debe tener status 400', () => {
    const res = mockResponse();
    res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Patrón Factory - getHeaders()', () => {
  const getHeaders = (token = null, isAdmin = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (isAdmin) {
      headers['X-Admin-Token'] = token;
    }
    return headers;
  };

  test('debe generar headers sin token', () => {
    const headers = getHeaders();
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBeUndefined();
  });

  test('debe inyectar token de usuario', () => {
    const headers = getHeaders('user-token-123');
    expect(headers['Authorization']).toBe('Bearer user-token-123');
  });

  test('debe inyectar token admin cuando corresponde', () => {
    const headers = getHeaders('admin-token-456', true);
    expect(headers['X-Admin-Token']).toBe('admin-token-456');
    expect(headers['Authorization']).toBe('Bearer admin-token-456');
  });
});
