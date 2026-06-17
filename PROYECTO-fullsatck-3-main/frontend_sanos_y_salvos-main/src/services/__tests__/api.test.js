/**
 * Tests del service layer geoServiceClient.createLocation.
 * Verifica la construccion del payload del fetch (especialmente imagen_url,
 * que era el campo olvidado que dejaba todas las Locations sin foto).
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { geoServiceClient } from '../api';

describe('geoServiceClient.createLocation', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const baseData = {
    latitud: '-33.45',
    longitud: '-70.66',
    tipo_reporte: 'perdido',
    tipo_animal: 'perro',
    titulo: 'Perro perdido',
    descripcion: 'Golden retriever',
    fecha_reporte: '2026-06-17',
  };

  test('incluye imagen_url en el body cuando se provee', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, reporte_id: 'rep_x' }),
    });

    await geoServiceClient.createLocation({
      ...baseData,
      imagen_url: 'http://localhost:8006/media/pets_uploaded/foto.jpg',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, opts] = global.fetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.imagen_url).toBe('http://localhost:8006/media/pets_uploaded/foto.jpg');
    // Sanity: otros campos clave siguen presentes
    expect(body.tipo_reporte).toBe('perdido');
    expect(body.latitud).toBe(-33.45);
  });

  test('imagen_url cae a null cuando no se provee', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 2 }),
    });

    await geoServiceClient.createLocation(baseData);

    const [, opts] = global.fetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body).toHaveProperty('imagen_url', null);
  });
});
