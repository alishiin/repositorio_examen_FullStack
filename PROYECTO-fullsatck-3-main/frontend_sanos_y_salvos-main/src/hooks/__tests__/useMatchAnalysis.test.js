/**
 * Tests useMatchAnalysis.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  matchServiceClient: {
    analyzeWithImage: vi.fn(),
  },
}));

import { matchServiceClient } from '../../services/api';
import useMatchAnalysis from '../useMatchAnalysis';

beforeEach(() => {
  matchServiceClient.analyzeWithImage.mockReset();
});

const makeImg = () => new File(['x'], 'p.jpg', { type: 'image/jpeg' });

describe('useMatchAnalysis', () => {
  test('estado inicial', () => {
    const { result } = renderHook(() => useMatchAnalysis());
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('analyzeImage exitoso', async () => {
    matchServiceClient.analyzeWithImage.mockResolvedValue({
      descripcion_automatica: 'Perro labrador negro',
    });
    const { result } = renderHook(() => useMatchAnalysis());

    let returned;
    await act(async () => {
      returned = await result.current.analyzeImage(1, 'perro', makeImg());
    });
    expect(returned.descripcion_automatica).toContain('labrador');
    expect(result.current.result).toEqual(returned);
    expect(result.current.error).toBeNull();
  });

  test('falla sin reportId', async () => {
    const { result } = renderHook(() => useMatchAnalysis());
    await act(async () => {
      await expect(result.current.analyzeImage(null, 'perro', makeImg())).rejects.toThrow(
        /Faltan/,
      );
    });
  });

  test('falla sin imageFile', async () => {
    const { result } = renderHook(() => useMatchAnalysis());
    await act(async () => {
      await expect(result.current.analyzeImage(1, 'perro', null)).rejects.toThrow(/Faltan/);
    });
  });

  test('rechaza pet types invalidos', async () => {
    const { result } = renderHook(() => useMatchAnalysis());
    await act(async () => {
      await expect(result.current.analyzeImage(1, 'pajaro', makeImg())).rejects.toThrow(
        /perro.*gato/,
      );
    });
  });

  test('error del API se propaga', async () => {
    matchServiceClient.analyzeWithImage.mockRejectedValue(new Error('gemini muerto'));
    const { result } = renderHook(() => useMatchAnalysis());
    await act(async () => {
      await expect(result.current.analyzeImage(1, 'perro', makeImg())).rejects.toThrow(
        'gemini muerto',
      );
    });
    expect(result.current.error).toBe('gemini muerto');
  });
});
