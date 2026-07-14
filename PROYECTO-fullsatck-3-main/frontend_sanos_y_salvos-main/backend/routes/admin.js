import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Obtener ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Credenciales admin hardcodeadas (en producción usar base de datos)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Ruta para almacenar estados de reportes
const ADMIN_STATE_FILE = path.join(__dirname, '../data/admin-state.json');

// Crear directorio de datos si no existe
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Cargar o crear estado admin
const getAdminState = () => {
  ensureDataDir();
  if (fs.existsSync(ADMIN_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ADMIN_STATE_FILE, 'utf-8'));
    } catch (error) {
      console.error('Error leyendo admin state:', error);
      return { reportStates: {}, deletedReports: [] };
    }
  }
  return { reportStates: {}, deletedReports: [] };
};

// Guardar estado admin
const saveAdminState = (state) => {
  ensureDataDir();
  fs.writeFileSync(ADMIN_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
};

// Consultar geoservice
const GEO_SERVICE_URL = (() => {
  const rawUrl = (process.env.GEO_SERVICE_URL || 'http://localhost:8003').replace(/\/$/, '');
  return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
})();

const fetchFromGeoService = async (endpoint) => {
  try {
    const response = await fetch(`${GEO_SERVICE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error consultando GeoService: ${error.message}`);
    return null;
  }
};

const deleteFromGeoService = async (reporteId) => {
  try {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/${reporteId}/`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error(`Error eliminando en GeoService: ${error.message}`);
    return false;
  }
};

const patchToGeoService = async (reporteId, updates) => {
  try {
    const response = await fetch(`${GEO_SERVICE_URL}/ubicaciones/${reporteId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GeoService PATCH error ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error PATCH GeoService: ${error.message}`);
    throw error;
  }
};

// Consultar User Service para obtener datos de usuario
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8002';
const userCache = {}; // Cache simple para evitar llamadas repetidas

const fetchUserData = async (userId) => {
  try {
    // Verificar si está en cache
    if (userCache[userId]) {
      return userCache[userId];
    }
    
    // Si no hay userId, devolver datos por defecto
    if (!userId) {
      return { full_name: 'Usuario Anónimo', email: 'No especificado', phone: 'No disponible' };
    }
    
    const response = await fetch(`${USER_SERVICE_URL}/users/${userId}/`);
    if (!response.ok) {
      console.warn(`Usuario ${userId} no encontrado`);
      return { full_name: 'Usuario Desconocido', email: 'No especificado', phone: 'No disponible' };
    }
    
    const userData = await response.json();
    // Cachear los datos
    userCache[userId] = {
      full_name: userData.full_name || 'Usuario',
      email: userData.email || 'No especificado',
      phone: userData.phone || 'No disponible'
    };
    
    return userCache[userId];
  } catch (error) {
    console.error(`Error consultando User Service para usuario ${userId}: ${error.message}`);
    return { full_name: 'Usuario Desconocido', email: 'No especificado', phone: 'No disponible' };
  }
};

// Middleware para verificar token admin (simple simulación)
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'admin-token-123') {
    next();
  } else {
    res.status(401).json({ success: false, message: 'No autorizado' });
  }
};

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({
      success: true,
      token: 'admin-token-123',
      admin: {
        username,
        email: 'admin@sanosalysvos.com',
        name: 'Administrador'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

// GET /api/admin/dashboard - Estadísticas del dashboard (datos reales de GeoService)
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    // Obtener todos los reportes de geoservice
    const locationData = await fetchFromGeoService('/ubicaciones/?page_size=100');
    const adminState = getAdminState();
    
    if (!locationData || !locationData.results) {
      return res.json({
        success: true,
        data: {
          totalPending: 0,
          totalMissing: 0,
          totalFound: 0,
          totalRecovered: 0,
          thisMonth: {
            missing: 0,
            found: 0,
            recovered: 0
          },
          recentActivity: []
        }
      });
    }

    // Procesar datos reales
    const allReports = locationData.results.filter(report => 
      !adminState.deletedReports.includes(report.id)
    );

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    let totalMissing = 0, totalFound = 0, totalPending = 0;
    let monthMissing = 0, monthFound = 0;
    
    // Procesar reportes y obtener datos de usuarios en paralelo
    const recentActivityPromises = [];

    for (const report of allReports) {
      const reportState = adminState.reportStates[report.id] || { status: 'pending' };
      const isMissing = report.tipo_reporte === 'perdido';
      
      if (isMissing) totalMissing++;
      else totalFound++;

      if (reportState.status === 'pending') totalPending++;

      const reportDate = report.fecha_reporte ? report.fecha_reporte.split('T')[0] : '';
      if (reportDate.startsWith(currentMonth)) {
        if (isMissing) monthMissing++;
        else monthFound++;
      }

      if (recentActivityPromises.length < 10) {
        // Obtener datos del usuario de forma asíncrona
        recentActivityPromises.push(
          fetchUserData(report.usuario_id).then(userData => ({
            id: report.id,
            type: isMissing ? 'missing' : 'found',
            petName: report.tipo_animal === 'perro' ? 'Perro' : report.tipo_animal === 'gato' ? 'Gato' : 'Mascota',
            reporter: userData.full_name || 'Usuario',
            date: report.fecha_reporte || new Date().toISOString(),
            status: reportState.status
          }))
        );
      }
    }

    // Esperar a que se obtengan todos los datos de usuarios
    const recentActivity = await Promise.all(recentActivityPromises);

    res.json({
      success: true,
      data: {
        totalPending,
        totalMissing,
        totalFound,
        totalRecovered: allReports.filter(r => 
          (adminState.reportStates[r.id] || { status: 'pending' }).status === 'recovered'
        ).length,
        thisMonth: {
          missing: monthMissing,
          found: monthFound,
          recovered: 0
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// GET /api/admin/pets - Obtener todos los reportes (datos reales de GeoService)
router.get('/pets', isAdmin, async (req, res) => {
  try {
    const { status = 'all', type = 'all', search = '' } = req.query;

    // Obtener reportes reales de geoservice
    const locationData = await fetchFromGeoService('/ubicaciones/?page_size=100');
    const adminState = getAdminState();

    if (!locationData || !locationData.results) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Filtrar reportes no eliminados y obtener datos de usuarios
    const filteredReports = locationData.results.filter(report => 
      !adminState.deletedReports.includes(report.id)
    );

    // Obtener datos de usuarios en paralelo
    const petsPromises = filteredReports.map(async (report) => {
      const reportState = adminState.reportStates[report.id] || { status: 'pending', notes: '' };
      const isMissing = report.tipo_reporte === 'perdido';
      const userData = await fetchUserData(report.usuario_id);

      return {
        id: report.id,
        name: report.tipo_animal === 'perro' ? 'Perro' : report.tipo_animal === 'gato' ? 'Gato' : 'Mascota',
        type: report.tipo_animal,
        breed: report.raza_probable || 'Desconocida',
        color: report.color || 'No especificado',
        reportType: isMissing ? 'missing' : 'found',
        status: reportState.status,
        reporter: userData.full_name || 'Usuario',
        email: userData.email || 'No especificado',
        phone: userData.phone || 'No disponible',
        description: report.descripcion || report.titulo,
        image: 'https://images.unsplash.com/photo-1633722715463-d30628519d24?w=200&h=200&fit=crop',
        location: report.titulo || 'Zona reportada',
        reportDate: report.fecha_reporte || new Date().toISOString(),
        latitude: report.latitud,
        longitude: report.longitud,
        notes: reportState.notes || '',
        estado: report.estado || 'activo',
        tamaño: report.tamaño || report.tamano || '',
        clinics: []
      };
    });

    const allPets = await Promise.all(petsPromises);

    // Aplicar filtros
    let filtered = allPets;

    if (status !== 'all') {
      filtered = filtered.filter(pet => pet.status === status);
    }

    if (type !== 'all') {
      filtered = filtered.filter(pet => 
        (type === 'missing' && pet.reportType === 'missing') ||
        (type === 'found' && pet.reportType === 'found')
      );
    }

    if (search) {
      filtered = filtered.filter(pet =>
        pet.name.toLowerCase().includes(search.toLowerCase()) ||
        pet.reporter.toLowerCase().includes(search.toLowerCase()) ||
        pet.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    console.error('Error en GET /pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes'
    });
  }
});

// GET /api/admin/pets/:id - Obtener detalle de reporte (datos reales de GeoService)
router.get('/pets/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminState = getAdminState();

    // Obtener el reporte específico de geoservice
    const locationData = await fetchFromGeoService(`/ubicaciones/${id}/`);

    if (!locationData || adminState.deletedReports.includes(id)) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    const report = locationData.results ? locationData.results[0] : locationData;
    const reportState = adminState.reportStates[id] || { status: 'pending', notes: '' };
    const isMissing = report.tipo_reporte === 'perdido';
    
    // Obtener datos reales del usuario
    const userData = await fetchUserData(report.usuario_id);

    const petDetail = {
      id: report.id,
      name: report.tipo_animal === 'perro' ? 'Perro' : report.tipo_animal === 'gato' ? 'Gato' : 'Mascota',
      type: report.tipo_animal,
      breed: report.raza_probable || 'Desconocida',
      age: 'No especificado',
      color: report.color || 'No especificado',
      microchip: 'No disponible',
      vaccinated: false,
      reportType: isMissing ? 'missing' : 'found',
      status: reportState.status,
      reporter: {
        name: userData.full_name || 'Usuario',
        email: userData.email || 'No especificado',
        phone: userData.phone || 'No disponible',
        address: 'No especificada'
      },
      description: report.descripcion || report.titulo,
      image: 'https://images.unsplash.com/photo-1633722715463-d30628519d24?w=400&h=400&fit=crop',
      location: {
        area: report.titulo || 'Zona reportada',
        lat: report.latitud,
        lng: report.longitud
      },
      reportDate: report.fecha_reporte || new Date().toISOString(),
      clinics: [],
      notes: reportState.notes || '',
      estado: report.estado || 'activo',
      tamaño: report.tamaño || report.tamano || '',
      attachments: []
    };

    res.json({
      success: true,
      data: petDetail
    });
  } catch (error) {
    console.error('Error en GET /pets/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del reporte'
    });
  }
});

// PUT /api/admin/pets/:id/approve
router.put('/pets/:id/approve', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const adminState = getAdminState();
    
    // Actualizar estado del reporte
    adminState.reportStates[id] = {
      status: 'approved',
      notes: notes || '',
      approvedAt: new Date().toISOString()
    };

    saveAdminState(adminState);

    res.json({
      success: true,
      message: 'Reporte aprobado',
      petId: id,
      newStatus: 'approved',
      notes
    });
  } catch (error) {
    console.error('Error en approve:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar reporte'
    });
  }
});

// PUT /api/admin/pets/:id/reject
router.put('/pets/:id/reject', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const adminState = getAdminState();

    // Actualizar estado del reporte
    adminState.reportStates[id] = {
      status: 'rejected',
      notes: reason || '',
      rejectedAt: new Date().toISOString()
    };

    saveAdminState(adminState);

    res.json({
      success: true,
      message: 'Reporte rechazado',
      petId: id,
      newStatus: 'rejected',
      reason
    });
  } catch (error) {
    console.error('Error en reject:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar reporte'
    });
  }
});

// PUT /api/admin/pets/:id/recover
router.put('/pets/:id/recover', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { clinicId, recoveryDate } = req.body;

    const adminState = getAdminState();

    // Actualizar estado del reporte
    adminState.reportStates[id] = {
      status: 'recovered',
      notes: `Recuperada en clínica ${clinicId || 'No especificada'}`,
      recoveredAt: recoveryDate || new Date().toISOString(),
      clinicId
    };

    saveAdminState(adminState);

    res.json({
      success: true,
      message: 'Mascota marcada como recuperada',
      petId: id,
      newStatus: 'recovered',
      clinicId,
      recoveryDate
    });
  } catch (error) {
    console.error('Error en recover:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como recuperada'
    });
  }
});

// PUT /api/admin/pets/:id - Actualizar campos editables del reporte en GeoService
router.put('/pets/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'titulo', 'descripcion', 'tipo_reporte', 'tipo_animal',
      'raza_probable', 'color', 'tamaño', 'tamano', 'estado'
    ];

    // Filtrar solo campos permitidos del body
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // El modelo usa 'tamaño' (con tilde). Si llega 'tamano', lo normalizamos.
        const targetField = field === 'tamano' ? 'tamaño' : field;
        updates[targetField] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    // Validar enums
    if (updates.tipo_reporte && !['perdido', 'encontrado'].includes(updates.tipo_reporte)) {
      return res.status(400).json({
        success: false,
        message: 'tipo_reporte debe ser "perdido" o "encontrado"'
      });
    }
    if (updates.estado && !['activo', 'resuelto', 'cerrado'].includes(updates.estado)) {
      return res.status(400).json({
        success: false,
        message: 'estado debe ser "activo", "resuelto" o "cerrado"'
      });
    }

    const updated = await patchToGeoService(id, updates);

    res.json({
      success: true,
      message: 'Reporte actualizado correctamente',
      data: updated
    });
  } catch (error) {
    console.error('Error en PUT /pets/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el reporte',
      error: error.message
    });
  }
});

// DELETE /api/admin/pets/:id - Eliminar reporte (realmente funcional)
router.delete('/pets/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminState = getAdminState();

    // Marcar como eliminado en nuestro estado
    adminState.deletedReports.push(id);
    saveAdminState(adminState);

    // Intentar eliminar de geoservice
    await deleteFromGeoService(id);

    res.json({
      success: true,
      message: 'Reporte eliminado correctamente',
      petId: id
    });
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reporte'
    });
  }
});

// PUT /api/admin/pets/:id/notes
router.put('/pets/:id/notes', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const adminState = getAdminState();

    // Mantener el estado anterior pero actualizar las notas
    if (!adminState.reportStates[id]) {
      adminState.reportStates[id] = { status: 'pending' };
    }

    adminState.reportStates[id].notes = notes || '';
    adminState.reportStates[id].notesUpdatedAt = new Date().toISOString();

    saveAdminState(adminState);

    res.json({
      success: true,
      message: 'Notas actualizadas correctamente',
      petId: id,
      notes
    });
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar notas'
    });
  }
});

export default router;
