/**
 * Normaliza una URL de imagen.
 * - Si es absoluta (http...), la devuelve tal cual
 * - Si es relativa (/media/...), le antepone el host de MediaService
 * - Si es vacia/null, devuelve null
 */
const MEDIA_HOST = import.meta.env.VITE_MEDIA_HOST || 'http://localhost:8006';

export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/media') || url.startsWith('media')) {
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${MEDIA_HOST}${path}`;
  }
  return url;
}
