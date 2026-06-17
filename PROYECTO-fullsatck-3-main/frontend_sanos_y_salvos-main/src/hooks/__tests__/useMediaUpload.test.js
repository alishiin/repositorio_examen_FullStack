/**
 * Tests useMediaUpload.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  mediaServiceClient: {
    uploadPetImage: vi.fn(),
  },
}));

import { mediaServiceClient } from '../../services/api';
import useMediaUpload from '../useMediaUpload';

beforeEach(() => {
  mediaServiceClient.uploadPetImage.mockReset();
});

const makeImageFile = (name = 'foo.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['x'.repeat(size)], name, { type });
  return file;
};

describe('useMediaUpload', () => {
  test('estado inicial', () => {
    const { result } = renderHook(() => useMediaUpload());
    expect(result.current.loading).toBe(false);
    expect(result.current.uploadedImage).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  test('upload exitoso', async () => {
    mediaServiceClient.uploadPetImage.mockResolvedValue({ id: 'abc', image: '/foo.jpg' });
    const { result } = renderHook(() => useMediaUpload());

    let returned;
    await act(async () => {
      returned = await result.current.uploadImage(makeImageFile(), 'mi mascota');
    });

    expect(returned).toEqual({ id: 'abc', image: '/foo.jpg' });
    expect(result.current.uploadedImage).toEqual({ id: 'abc', image: '/foo.jpg' });
    expect(result.current.progress).toBe(100);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('falla si no se pasa archivo', async () => {
    const { result } = renderHook(() => useMediaUpload());
    await act(async () => {
      await expect(result.current.uploadImage(null)).rejects.toThrow(/imagen/);
    });
    expect(result.current.error).toMatch(/imagen/);
  });

  test('falla si el archivo no es imagen', async () => {
    const { result } = renderHook(() => useMediaUpload());
    const txt = new File(['hi'], 'foo.txt', { type: 'text/plain' });
    await act(async () => {
      await expect(result.current.uploadImage(txt)).rejects.toThrow(/imagen/);
    });
  });

  test('falla si excede 10MB', async () => {
    const { result } = renderHook(() => useMediaUpload());
    const big = makeImageFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024);
    await act(async () => {
      await expect(result.current.uploadImage(big)).rejects.toThrow(/grande/);
    });
  });

  test('error del cliente API se propaga', async () => {
    mediaServiceClient.uploadPetImage.mockRejectedValue(new Error('500 server'));
    const { result } = renderHook(() => useMediaUpload());
    await act(async () => {
      await expect(result.current.uploadImage(makeImageFile())).rejects.toThrow('500 server');
    });
    expect(result.current.error).toBe('500 server');
    expect(result.current.loading).toBe(false);
  });
});
