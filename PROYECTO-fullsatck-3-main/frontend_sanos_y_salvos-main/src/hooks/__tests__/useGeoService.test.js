/**
 * Tests useGeoService.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  geoServiceClient: {
    getNearbySpontaneous: vi.fn(),
    getLocations: vi.fn(),
    createLocation: vi.fn(),
  },
}));

import { geoServiceClient } from '../../services/api';
import { useGeoService } from '../useGeoService';

beforeEach(() => {
  geoServiceClient.getNearbySpontaneous.mockReset();
  geoServiceClient.getLocations.mockReset();
  geoServiceClient.createLocation.mockReset();
});

describe('useGeoService', () => {
  test('estado inicial', () => {
    const { result } = renderHook(() => useGeoService());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  test('searchNearby exitoso', async () => {
    geoServiceClient.getNearbySpontaneous.mockResolvedValue({ total_encontrados: 3 });
    const { result } = renderHook(() => useGeoService());
    let returned;
    await act(async () => {
      returned = await result.current.searchNearby(4.7, -74.0, 5, 'perdido');
    });
    expect(returned.total_encontrados).toBe(3);
    expect(result.current.data).toEqual(returned);
    expect(geoServiceClient.getNearbySpontaneous).toHaveBeenCalledWith(4.7, -74.0, 5, 'perdido');
  });

  test('searchNearby con error', async () => {
    geoServiceClient.getNearbySpontaneous.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useGeoService());
    await act(async () => {
      await expect(result.current.searchNearby(0, 0)).rejects.toThrow('500');
    });
    expect(result.current.error).toBe('500');
  });

  test('getLocations exitoso con filtros', async () => {
    geoServiceClient.getLocations.mockResolvedValue({ results: [] });
    const { result } = renderHook(() => useGeoService());
    await act(async () => {
      await result.current.getLocations({ tipo_animal: 'perro' });
    });
    expect(geoServiceClient.getLocations).toHaveBeenCalledWith({ tipo_animal: 'perro' });
    expect(result.current.data).toEqual({ results: [] });
  });

  test('getLocations con error', async () => {
    geoServiceClient.getLocations.mockRejectedValue(new Error('timeout'));
    const { result } = renderHook(() => useGeoService());
    await act(async () => {
      await expect(result.current.getLocations()).rejects.toThrow('timeout');
    });
    expect(result.current.error).toBe('timeout');
  });

  test('createLocation exitoso', async () => {
    geoServiceClient.createLocation.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useGeoService());
    let returned;
    await act(async () => {
      returned = await result.current.createLocation({ titulo: 'X' });
    });
    expect(returned).toEqual({ id: 1 });
  });

  test('createLocation propaga error', async () => {
    geoServiceClient.createLocation.mockRejectedValue(new Error('400 invalid'));
    const { result } = renderHook(() => useGeoService());
    await act(async () => {
      await expect(result.current.createLocation({})).rejects.toThrow('400 invalid');
    });
    expect(result.current.error).toBe('400 invalid');
  });
});
