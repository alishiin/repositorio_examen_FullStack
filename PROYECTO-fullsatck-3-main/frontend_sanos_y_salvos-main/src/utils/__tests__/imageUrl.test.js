import { describe, test, expect } from 'vitest';
import { resolveImageUrl } from '../imageUrl';

describe('resolveImageUrl', () => {
  test('devuelve null para vacio/null/undefined', () => {
    expect(resolveImageUrl(null)).toBe(null);
    expect(resolveImageUrl(undefined)).toBe(null);
    expect(resolveImageUrl('')).toBe(null);
  });

  test('devuelve URL absoluta http tal cual', () => {
    const url = 'http://localhost:8006/media/pets_uploaded/abc.jpg';
    expect(resolveImageUrl(url)).toBe(url);
  });

  test('devuelve URL absoluta https tal cual', () => {
    const url = 'https://cdn.example.com/foto.png';
    expect(resolveImageUrl(url)).toBe(url);
  });

  test('antepone el host a ruta relativa /media/...', () => {
    expect(resolveImageUrl('/media/pets_uploaded/abc.jpg'))
      .toBe('http://localhost:8006/media/pets_uploaded/abc.jpg');
  });

  test('antepone el host y la barra a ruta sin slash inicial', () => {
    expect(resolveImageUrl('media/pets_uploaded/abc.jpg'))
      .toBe('http://localhost:8006/media/pets_uploaded/abc.jpg');
  });

  test('devuelve el valor tal cual si no matchea ningun patron conocido', () => {
    expect(resolveImageUrl('data:image/png;base64,xxx')).toBe('data:image/png;base64,xxx');
  });
});
