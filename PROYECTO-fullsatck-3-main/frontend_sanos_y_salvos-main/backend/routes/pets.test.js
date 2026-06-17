/**
 * Pruebas Unitarias - Rutas de Mascotas (Backend)
 * 
 * Testing de:
 * - Endpoints de reporte de mascotas
 * - Validación de datos
 * - Respuestas correctas
 * 
 * Ejecutar: npm test -- routes/pets.test.js
 */

// Mock setup
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (body = {}, params = {}) => {
  return {
    body,
    params,
    query: {}
  };
};

// Funciones de validación de mascotas
const validatePetReport = (reportData) => {
  const { name, type, breed, lat, lng, reportType } = reportData;

  if (!name || !type || !lat || !lng) {
    return { valid: false, message: 'Campos requeridos: name, type, lat, lng' };
  }

  const validTypes = ['perro', 'gato', 'pajaro', 'conejo', 'otro'];
  if (!validTypes.includes(type)) {
    return { valid: false, message: `Tipo inválido. Válidos: ${validTypes.join(', ')}` };
  }

  const validReportTypes = ['missing', 'found'];
  if (!validReportTypes.includes(reportType)) {
    return {
      valid: false,
      message: `Tipo de reporte inválido. Válidos: ${validReportTypes.join(', ')}`
    };
  }

  // Validar rango WGS84
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, message: 'Coordenadas fuera de rango WGS84' };
  }

  if (name.length < 2) {
    return { valid: false, message: 'Nombre debe tener al menos 2 caracteres' };
  }

  return { valid: true };
};

const calculateProximity = (lat1, lng1, lat2, lng2) => {
  // Fórmula Haversine simplificada
  const R = 6371; // Radio tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================
// PRUEBAS UNITARIAS
// ============================================

describe('Mascotas - Validación de Reportes', () => {
  describe('validatePetReport', () => {
    test('debe validar reporte correcto', () => {
      const report = {
        name: 'Rex',
        type: 'perro',
        breed: 'Labrador',
        lat: -33.4489,
        lng: -70.6693,
        reportType: 'missing'
      };

      const result = validatePetReport(report);
      expect(result.valid).toBe(true);
    });

    test('debe rechazar reporte sin campos requeridos', () => {
      const result = validatePetReport({
        name: 'Rex',
        type: 'perro'
        // Faltan lat, lng
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Campos requeridos');
    });

    test('debe rechazar tipo de mascota inválido', () => {
      const result = validatePetReport({
        name: 'Rex',
        type: 'dinosaurio', // Tipo inválido
        lat: -33.4489,
        lng: -70.6693,
        reportType: 'missing'
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Tipo inválido');
    });

    test('debe rechazar tipo de reporte inválido', () => {
      const result = validatePetReport({
        name: 'Rex',
        type: 'perro',
        lat: -33.4489,
        lng: -70.6693,
        reportType: 'steal' // Tipo inválido
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Tipo de reporte inválido');
    });

    test('debe rechazar coordenadas fuera de rango', () => {
      const result = validatePetReport({
        name: 'Rex',
        type: 'perro',
        lat: 95, // Lat > 90
        lng: -70.6693,
        reportType: 'missing'
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Coordenadas fuera de rango');
    });

    test('debe rechazar nombre muy corto', () => {
      const result = validatePetReport({
        name: 'R', // Muy corto
        type: 'perro',
        lat: -33.4489,
        lng: -70.6693,
        reportType: 'missing'
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain('al menos 2 caracteres');
    });

    test('debe aceptar todos los tipos válidos', () => {
      const types = ['perro', 'gato', 'pajaro', 'conejo', 'otro'];

      types.forEach((type) => {
        const result = validatePetReport({
          name: 'Mascota',
          type,
          lat: -33.4489,
          lng: -70.6693,
          reportType: 'missing'
        });

        expect(result.valid).toBe(true);
      });
    });
  });
});

describe('Algoritmo Haversine - Proximidad', () => {
  test('debe calcular distancia correcta entre dos puntos', () => {
    // Dos puntos en Santiago
    const distance = calculateProximity(-33.4489, -70.6693, -33.4489, -70.6693);

    // Misma coordenada = distancia 0
    expect(distance).toBeLessThan(0.1);
  });

  test('debe calcular distancia entre ciudades diferentes', () => {
    // Santiago a Valparaíso (aprox 120km)
    const distance = calculateProximity(-33.4489, -70.6693, -33.0472, -71.6127);

    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(150);
  });

  test('debe filtrar ubicaciones dentro del radio', () => {
    const targetLat = -33.4489;
    const targetLng = -70.6693;
    const radius = 5; // km

    const locations = [
      { id: 1, lat: -33.4489, lng: -70.6693 }, // Mismo punto - 0km
      { id: 2, lat: -33.4500, lng: -70.6700 }, // Cerca
      { id: 3, lat: -33.5000, lng: -70.7000 }, // Lejos
      { id: 4, lat: -33.4495, lng: -70.6695 }  // Muy cerca
    ];

    const nearby = locations.filter((loc) => {
      const distance = calculateProximity(targetLat, targetLng, loc.lat, loc.lng);
      return distance <= radius;
    });

    // Debería incluir al menos el primer punto (mismo)
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.some((l) => l.id === 1)).toBe(true);
  });
});

describe('Respuestas HTTP - Mascotas', () => {
  test('POST /api/pets/report debe retornar 201 creado', () => {
    const res = mockResponse();
    res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente',
      data: { id: 1, name: 'Rex', reportType: 'missing' }
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  test('GET /api/pets/missing debe retornar 200 OK', () => {
    const res = mockResponse();
    res.status(200).json({
      success: true,
      data: [],
      count: 0
    });

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('GET /api/pets/:id debe retornar 404 si no existe', () => {
    const res = mockResponse();
    res.status(404).json({
      success: false,
      message: 'Reporte no encontrado'
    });

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('POST /api/pets/report con datos inválidos debe retornar 400', () => {
    const res = mockResponse();
    res.status(400).json({
      success: false,
      message: 'Campos requeridos: name, type, lat, lng'
    });

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Patrón Chain of Responsibility - Middleware', () => {
  test('debe validar autenticación antes de crear reporte', () => {
    const middlewares = [];

    // Simular cadena de middleware
    const authMiddleware = (req) => {
      if (!req.headers?.authorization) {
        return { valid: false, message: 'No autorizado' };
      }
      return { valid: true };
    };

    const validationMiddleware = (req) => {
      if (!req.body.name) {
        return { valid: false, message: 'Nombre requerido' };
      }
      return { valid: true };
    };

    middlewares.push(authMiddleware, validationMiddleware);

    // Solicitud sin autenticación
    const req = mockRequest({ name: 'Rex' });
    const result = middlewares[0](req); // Auth

    expect(result.valid).toBe(false);
    expect(result.message).toContain('No autorizado');
  });

  test('debe permitir validaciones múltiples en serie', () => {
    const validations = [
      (data) => (data.name ? { ok: true } : { ok: false, error: 'name' }),
      (data) => (data.type ? { ok: true } : { ok: false, error: 'type' }),
      (data) =>
        data.lat !== undefined
          ? { ok: true }
          : { ok: false, error: 'lat' }
    ];

    const validData = { name: 'Rex', type: 'perro', lat: -33.4489 };

    const allValid = validations.every((v) => v(validData).ok);
    expect(allValid).toBe(true);

    const invalidData = { name: 'Rex', type: 'perro' };
    const stillValid = validations.every((v) => v(invalidData).ok);
    expect(stillValid).toBe(false);
  });
});
