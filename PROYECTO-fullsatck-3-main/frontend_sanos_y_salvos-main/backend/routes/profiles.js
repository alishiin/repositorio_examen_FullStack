import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const PROFILE_FILE = path.join(DATA_DIR, 'institution-profiles.json');

const DEFAULT_PROFILES = {
  veterinaria: {
    type: 'veterinaria',
    name: 'Clínica Sanos y Salvos',
    tagline: 'Atención veterinaria, red de apoyo y seguimiento de mascotas perdidas',
    logo: '🏥',
    contact: {
      email: 'contacto@sanosysalvos.cl',
      phone: '+56 9 4782 0482',
      whatsapp: '+56 9 4782 0482',
    },
    address: 'Av. Apoquindo 1234, Santiago Centro',
    latitud: -33.4167,
    longitud: -70.6036,
    hours: 'Lun a Vie 08:00 - 20:00 / Sáb 09:00 - 14:00',
    description: 'Red veterinaria especializada en atención de urgencia, resguardo temporal y coordinación con equipos municipales.',
    services: ['Urgencias', 'Rayos X', 'Hospitalización', 'Vacunación', 'Rescate y rescate temporal'],
    social: {
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
    },
  },
  municipalidad: {
    type: 'municipalidad',
    name: 'Municipalidad de Sanos y Salvos',
    tagline: 'Coordinación comunitaria y gestión territorial para mascotas y vecinos',
    logo: '🏛️',
    contact: {
      email: 'municipio@sanosysalvos.cl',
      phone: '+56 2 2345 6789',
      whatsapp: '+56 9 9988 7766',
    },
    address: 'Plaza Central 100, Santiago',
    latitud: -33.4489,
    longitud: -70.6693,
    hours: 'Lun a Vie 09:00 - 17:30',
    description: 'Perfil institucional para coordinar campañas, difusión de alertas y apoyo a la comunidad en la recuperación de mascotas.',
    services: ['Difusión territorial', 'Campañas comunitarias', 'Recepción de denuncias', 'Coordinación con veterinarias'],
    social: {
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
    },
  },
};

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readStore = () => {
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEFAULT_PROFILES, null, 2), 'utf-8');
    return { ...DEFAULT_PROFILES };
  }

  try {
    const store = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
    return {
      ...DEFAULT_PROFILES,
      ...store,
    };
  } catch (error) {
    console.error('Error leyendo perfiles institucionales:', error);
    return { ...DEFAULT_PROFILES };
  }
};

const writeStore = (store) => {
  ensureDataDir();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(store, null, 2), 'utf-8');
};

const requireAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'admin-token-123') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Solo el administrador puede modificar perfiles institucionales',
  });
};

router.get('/:type', (req, res) => {
  const store = readStore();
  const profile = store[req.params.type];

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Perfil institucional no encontrado',
    });
  }

  res.json({
    success: true,
    data: profile,
  });
});

router.post('/:type', requireAdminToken, (req, res) => {
  const { type } = req.params;
  const store = readStore();

  if (store[type]) {
    return res.status(409).json({
      success: false,
      message: 'El perfil institucional ya existe',
    });
  }

  store[type] = {
    type,
    ...req.body,
    contact: req.body.contact || {},
    social: req.body.social || {},
    services: Array.isArray(req.body.services) ? req.body.services : [],
  };

  writeStore(store);

  res.status(201).json({
    success: true,
    message: 'Perfil institucional creado correctamente',
    data: store[type],
  });
});

router.put('/:type', requireAdminToken, (req, res) => {
  const { type } = req.params;
  const store = readStore();

  if (!store[type]) {
    return res.status(404).json({
      success: false,
      message: 'Perfil institucional no encontrado',
    });
  }

  store[type] = {
    ...store[type],
    ...req.body,
    contact: {
      ...store[type].contact,
      ...(req.body.contact || {}),
    },
    social: {
      ...store[type].social,
      ...(req.body.social || {}),
    },
  };

  writeStore(store);

  res.json({
    success: true,
    message: 'Perfil institucional actualizado correctamente',
    data: store[type],
  });
});

router.delete('/:type', requireAdminToken, (req, res) => {
  const { type } = req.params;
  const store = readStore();

  if (!store[type]) {
    return res.status(404).json({
      success: false,
      message: 'Perfil institucional no encontrado',
    });
  }

  delete store[type];
  writeStore(store);

  res.json({
    success: true,
    message: 'Perfil institucional eliminado correctamente',
  });
});

export default router;