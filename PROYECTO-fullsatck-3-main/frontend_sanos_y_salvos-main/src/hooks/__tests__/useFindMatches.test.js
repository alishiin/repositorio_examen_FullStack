/**
 * Tests useFindMatches.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  matchServiceClient: {
    findMatches: vi.fn(),
  },
}));

import { matchServiceClient } from '../../services/api';
import { useFindMatches } from '../useFindMatches';

beforeEach(() => {
  matchServiceClient.findMatches.mockReset();
});

const payload = {
  report_id: 'rep_x',
  tipo_reporte: 'perdido',
  tipo_animal: 'perro',
};

describe('useFindMatches', () => {
  test('estado inicial', () => {
    const { result } = renderHook(() => useFindMatches());
    expect(result.current.loading).toBe(false);
    expect(result.current.matches).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('findMatches exitoso popla matches', async () => {
    matchServiceClient.findMatches.mockResolvedValue({
      matches: [{ score: 75, reasons: ['misma_raza'], reporte: { id: 1 } }],
      total: 1,
    });
    const { result } = renderHook(() => useFindMatches());

    let returned;
    await act(async () => {
      returned = await result.current.findMatches(payload);
    });

    expect(returned.total).toBe(1);
    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].score).toBe(75);
    expect(result.current.error).toBeNull();
  });

  test('findMatches sin matches devuelve lista vacia', async () => {
    matchServiceClient.findMatches.mockResolvedValue({ matches: [], total: 0 });
    const { result } = renderHook(() => useFindMatches());

    await act(async () => {
      await result.current.findMatches(payload);
    });

    expect(result.current.matches).toEqual([]);
  });

  test('error del API se propaga y resetea matches', async () => {
    matchServiceClient.findMatches.mockRejectedValue(new Error('match down'));
    const { result } = renderHook(() => useFindMatches());

    await act(async () => {
      await expect(result.current.findMatches(payload)).rejects.toThrow('match down');
    });

    expect(result.current.error).toBe('match down');
    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  test('reset limpia matches y error', async () => {
    matchServiceClient.findMatches.mockResolvedValue({
      matches: [{ score: 80, reasons: [], reporte: {} }],
    });
    const { result } = renderHook(() => useFindMatches());

    await act(async () => {
      await result.current.findMatches(payload);
    });
    expect(result.current.matches).toHaveLength(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.matches).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
