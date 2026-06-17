/**
 * Comunas de la Region Metropolitana de Santiago, Chile.
 * Nombres oficiales con capitalizacion correcta (Title Case espanol).
 * Source of truth - usar siempre desde aqui para evitar variaciones.
 */
export const COMUNAS_RM = [
  // Provincia de Santiago
  'Cerrillos',
  'Cerro Navia',
  'Conchalí',
  'El Bosque',
  'Estación Central',
  'Huechuraba',
  'Independencia',
  'La Cisterna',
  'La Florida',
  'La Granja',
  'La Pintana',
  'La Reina',
  'Las Condes',
  'Lo Barnechea',
  'Lo Espejo',
  'Lo Prado',
  'Macul',
  'Maipú',
  'Ñuñoa',
  'Pedro Aguirre Cerda',
  'Peñalolén',
  'Providencia',
  'Pudahuel',
  'Quilicura',
  'Quinta Normal',
  'Recoleta',
  'Renca',
  'San Joaquín',
  'San Miguel',
  'San Ramón',
  'Santiago',
  'Vitacura',
  // Provincia Cordillera
  'Pirque',
  'Puente Alto',
  'San José de Maipo',
  // Provincia Chacabuco
  'Colina',
  'Lampa',
  'Tiltil',
  // Provincia Maipo
  'Buin',
  'Calera de Tango',
  'Paine',
  'San Bernardo',
  // Provincia Melipilla
  'Alhué',
  'Curacaví',
  'María Pinto',
  'Melipilla',
  'San Pedro',
  // Provincia Talagante
  'El Monte',
  'Isla de Maipo',
  'Padre Hurtado',
  'Peñaflor',
  'Talagante',
];

/**
 * Normaliza un nombre de comuna (case + acentos insensibles) contra
 * la lista oficial. Devuelve el nombre canonico o null si no matchea.
 */
export function normalizeComuna(input) {
  if (!input) return null;
  const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const target = stripAccents(String(input).trim().toLowerCase());
  return COMUNAS_RM.find((c) => stripAccents(c.toLowerCase()) === target) || null;
}
