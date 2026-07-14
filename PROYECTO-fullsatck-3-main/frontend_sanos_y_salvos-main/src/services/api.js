// src/services/api.js
const GEO_SERVICE_URL = import.meta.env.VITE_GEO_SERVICE_URL || 'http://localhost:5000/api';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://127.0.0.1:8002';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://127.0.0.1:8001';

// BFF URLs para nuevos microservicios
const BFF_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:5000';
const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || `${BFF_URL}/api/chat`;
const MATCH_SERVICE_URL = import.meta.env.VITE_MATCH_SERVICE_URL || `${BFF_URL}/api/match`;
const MEDIA_SERVICE_URL = import.meta.env.VITE_MEDIA_SERVICE_URL || `${BFF_URL}/api/media`;
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || `${BFF_URL}/api/notifications`;
const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL || `${BFF_URL}/api/profiles`;
const LOCAL_INSTITUTION_PROFILES_KEY = 'localInstitutionProfiles';

const readLocalInstitutionProfiles = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(LOCAL_INSTITUTION_PROFILES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('❌ Error leyendo perfiles institucionales locales:', error);
    return [];
  }
};

const writeLocalInstitutionProfiles = (profiles) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_INSTITUTION_PROFILES_KEY, JSON.stringify(profiles));
};

export const geoServiceClient = {
  async getNearbySpontaneous(latitude, longitude, radiusKm = 10, reportType = 'ambos') {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/buscar_cercanos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitud: latitude,
        longitud: longitude,
        radio_km: radiusKm,
        tipo_reporte: reportType,
      }),
    });

    if (!response.ok) throw new Error('Error en búsqueda de proximidad');
    return response.json();
  },

  async getLocations(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/?${params}`);
    if (!response.ok) throw new Error('Error al obtener ubicaciones');
    return response.json();
  },

  async createLocation(locationData) {
    // Generar IDs únicos para reporte_id y pet_id
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const reporte_id = `rep_${timestamp}_${random}`;
    const pet_id = `pet_${timestamp}_${random}`;

    const payload = {
      reporte_id: reporte_id,
      pet_id: pet_id,
      usuario_id: locationData.usuario_id || null,
      latitud: parseFloat(locationData.latitud),
      longitud: parseFloat(locationData.longitud),
      tipo_reporte: locationData.tipo_reporte,
      tipo_animal: locationData.tipo_animal,
      raza_probable: locationData.raza_probable || '',
      color: locationData.color || '',
      tamaño: locationData.tamaño || '',
      titulo: locationData.titulo,
      descripcion: locationData.descripcion,
      fecha_reporte: locationData.fecha_reporte,
      imagen_url: locationData.imagen_url || null,
    };

    console.log('Enviando a GEO_SERVICE:', payload);

    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          errorMsg += `: ${JSON.stringify(errorData)}`;
        } else {
          const text = await response.text();
          console.error('Error del servidor (text):', text);
          errorMsg += `: ${text.substring(0, 200)}`;
        }
      } catch (e) {
        console.error('No se pudo parsear respuesta:', e);
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log('Ubicación creada:', result);
    return result;
  },

  async getLocation(id) {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/${id}/`);
    if (!response.ok) throw new Error('Ubicación no encontrada');
    return response.json();
  },

  async updateLocation(id, locationData) {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status} al actualizar ubicación`);
    }

    return response.json();
  },

  async deleteLocation(id) {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/${id}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status} al eliminar ubicación`);
    }

    return response.json();
  },
};

export const userServiceClient = {
  async login(email, password) {
    const response = await fetch(`${AUTH_SERVICE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Error en login');
    return response.json();
  },

  async register(userData) {
    const response = await fetch(`${USER_SERVICE_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Error en registro');
    return response.json();
  },
};

// ==========================================
// 🆕 NUEVOS MICROSERVICIOS - ENTREGA 3
// ==========================================

/**
 * Chat Service Client
 * Proporciona configuración para conectar con WebSockets
 */
export const chatServiceClient = {
  /**
   * Obtiene la configuración de WebSocket para conectarse al servicio de chat
   * @returns { wsUrl, endpoints }
   */
  async getChatConfig() {
    try {
      const response = await fetch(`${CHAT_SERVICE_URL}/config/`);
      if (!response.ok) throw new Error('Error obteniendo configuración de chat');
      return await response.json();
    } catch (error) {
      console.error('❌ Error en Chat Config:', error);
      throw error;
    }
  },

  /**
   * Valida el acceso a una sala de chat específica
   * @param {string} roomName - Nombre de la sala
   * @returns { wsUrl, room, authorized, wsEndpoint }
   */
  async validateRoomAccess(roomName) {
    try {
      const response = await fetch(`${CHAT_SERVICE_URL}/room/${roomName}/validate/`);
      if (!response.ok) throw new Error('Error validando acceso a la sala');
      return await response.json();
    } catch (error) {
      console.error('❌ Error validando sala:', error);
      throw error;
    }
  },

  /**
   * Conecta con el WebSocket de chat
   * @param {string} roomName - Nombre de la sala
   * @returns {WebSocket} - Conexión WebSocket activa
   */
  connectToRoom(roomName, wsBaseOverride = '') {
    const resolvedTarget = wsBaseOverride
      || import.meta.env.VITE_CHAT_WS_URL
      || import.meta.env.VITE_CHAT_SERVICE_URL
      || 'ws://localhost:8004';
    const wsUrl = resolvedTarget.includes('/ws/chat/')
      ? resolvedTarget
      : (resolvedTarget.endsWith('/') ? `${resolvedTarget}ws/chat/${roomName}/` : `${resolvedTarget}/ws/chat/${roomName}/`);
    console.log(`Conectando a sala ${roomName}:`, wsUrl);
    return new WebSocket(wsUrl);
  },
};

/**
 * Match Service Client
 * Análisis de imágenes con IA para encontrar mascotas perdidas similares
 */
export const matchServiceClient = {
  /**
   * Analiza una imagen de mascota para encontrar coincidencias
   * @param {FormData} formData - Datos del formulario con archivo de imagen
   * @returns { message, report_id, pet_type, descripcion_automatica }
   */
  async analyzePetImage(formData) {
    try {
      const response = await fetch(`${MATCH_SERVICE_URL}/analyze/`, {
        method: 'POST',
        body: formData, // Enviar como FormData para multipart
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error analizando imagen');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Error en Match Service:', error);
      throw error;
    }
  },

  /**
   * Analiza una imagen con datos específicos
   * @param {string} reportId - ID del reporte
   * @param {string} petType - Tipo de mascota (perro/gato)
   * @param {File} imageFile - Archivo de imagen
   * @returns { message, report_id, pet_type, descripcion_automatica }
   */
  async analyzeWithImage(reportId, petType, imageFile) {
    const formData = new FormData();
    formData.append('report_id', reportId);
    formData.append('pet_type', petType);
    formData.append('image', imageFile);
    
    return this.analyzePetImage(formData);
  },

  /**
   * Busca coincidencias por metadata (raza, color, distancia, fecha) contra
   * los reportes del tipo opuesto. El backend persiste los matches y dispara
   * notificaciones a los autores de los reportes coincidentes.
   *
   * @param {Object} reportData - { report_id, tipo_reporte, tipo_animal,
   *   raza_probable?, color?, tamano?, latitud, longitud, fecha_reporte?,
   *   titulo?, user_id? }
   * @returns {Promise<{matches: Array, total: number}>}
   */
  async findMatches(reportData) {
    const response = await fetch(`${MATCH_SERVICE_URL}/find-matches/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error buscando coincidencias');
    }
    return await response.json();
  },
};

/**
 * Media Service Client
 * Gestión de carga y almacenamiento de imágenes de mascotas
 */
export const mediaServiceClient = {
  /**
   * Carga una imagen al servidor de media
   * @param {FormData} formData - Datos del formulario con archivo de imagen
   * @returns { id, image_url, uploaded_at }
   */
  async uploadImage(formData) {
    try {
      const response = await fetch(`${MEDIA_SERVICE_URL}/upload/`, {
        method: 'POST',
        body: formData, // Enviar como FormData para multipart
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cargando imagen');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Error en Media Service:', error);
      throw error;
    }
  },

  /**
   * Carga una imagen con archivo específico
   * @param {File} imageFile - Archivo de imagen
   * @param {string} description - Descripción de la imagen (opcional)
   * @returns { id, image_url, uploaded_at }
   */
  async uploadPetImage(imageFile, description = '') {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (description) {
      formData.append('description', description);
    }
    
    return this.uploadImage(formData);
  },
};

/**
 * Notifications Service Client
 * Envío de notificaciones a usuarios sobre matches de mascotas
 */
export const notificationsServiceClient = {
  /**
   * Envía una notificación de match a un usuario
   * @param {Object} params - Parámetros de la notificación
   * @param {number} params.userId - ID del usuario
   * @param {string} params.userEmail - Email del usuario
   * @param {number} params.matchId - ID del match
   * @param {string} params.petName - Nombre de la mascota
   * @returns { success, message, notification_id }
   */
  async triggerMatchNotification({ userId, userEmail, matchId, petName }) {
    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/trigger-match/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          match_id: matchId,
          pet_name: petName,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error enviando notificación');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Error en Notification Service:', error);
      throw error;
    }
  },

  /**
   * Alias para compatibilidad
   */
  async sendMatchNotification(userId, userEmail, matchId, petName) {
    return this.triggerMatchNotification({ userId, userEmail, matchId, petName });
  },

  /**
   * Lista las notificaciones in-app de un usuario (FASE 1B).
   * @param {number|string} userId
   * @returns {Promise<Array>} lista de notificaciones (o {results: []} si hay paginacion DRF)
   */
  async listNotifications(userId) {
    try {
      const url = `${NOTIFICATION_SERVICE_URL}/?user_id=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error listando notificaciones');
      }
      return await response.json();
    } catch (error) {
      console.error('Error listNotifications:', error);
      throw error;
    }
  },

  /**
   * Marca una notificacion como leida (FASE 1B).
   * @param {number|string} notificationId
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/${notificationId}/mark-read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error marcando como leida');
      }
      return await response.json();
    } catch (error) {
      console.error('Error markAsRead:', error);
      throw error;
    }
  },
};

export const institutionProfileClient = {
  getAdminHeaders() {
    const adminToken = localStorage.getItem('adminToken');
    return adminToken
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
      : { 'Content-Type': 'application/json' };
  },

  async getProfile(profileType) {
    const response = await fetch(`${PROFILE_SERVICE_URL}/${profileType}/`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error obteniendo perfil institucional');
    }
    return response.json();
  },

  getLocalProfiles(type) {
    const profiles = readLocalInstitutionProfiles();
    return type ? profiles.filter((profile) => profile.type === type) : profiles;
  },

  createLocalInstitutionProfile(type, profileData) {
    const currentProfiles = readLocalInstitutionProfiles();
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);

    const isMunicipalidad = type === 'municipalidad';

    const nextProfile = {
      id: `local_${type}_${timestamp}_${random}`,
      source: 'local',
      type,
      name: profileData.name || (isMunicipalidad ? 'Nueva municipalidad' : 'Nueva veterinaria'),
      tagline: profileData.tagline || '',
      logo: profileData.logo || (isMunicipalidad ? '🏛️' : '🏥'),
      contact: {
        email: profileData.contact?.email || profileData.email || '',
        phone: profileData.contact?.phone || profileData.phone || '',
        whatsapp: profileData.contact?.whatsapp || profileData.phone || '',
      },
      address: profileData.address || '',
      latitud: Number(profileData.latitud),
      longitud: Number(profileData.longitud),
      hours: profileData.hours || '',
      description: profileData.description || '',
      services: Array.isArray(profileData.services) ? profileData.services : [],
      social: profileData.social || {},
    };

    const nextProfiles = [...currentProfiles, nextProfile];
    writeLocalInstitutionProfiles(nextProfiles);

    return {
      success: true,
      data: nextProfile,
    };
  },

  createLocalVeterinaria(profileData) {
    return this.createLocalInstitutionProfile('veterinaria', profileData);
  },

  createLocalMunicipalidad(profileData) {
    return this.createLocalInstitutionProfile('municipalidad', profileData);
  },

  async updateProfile(profileType, profileData) {
    const response = await fetch(`${PROFILE_SERVICE_URL}/${profileType}/`, {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error actualizando perfil institucional');
    }

    return response.json();
  },

  async createProfile(profileType, profileData) {
    const response = await fetch(`${PROFILE_SERVICE_URL}/${profileType}/`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error creando perfil institucional');
    }

    return response.json();
  },

  async deleteProfile(profileType) {
    const response = await fetch(`${PROFILE_SERVICE_URL}/${profileType}/`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error eliminando perfil institucional');
    }

    return response.json();
  },
};
