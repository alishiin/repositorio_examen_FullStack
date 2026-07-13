import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './swagger-config.js';
import authRoutes from './routes/auth.js';
import petsRoutes from './routes/pets.js';
import clinicsRoutes from './routes/clinics.js';
import adminRoutes from './routes/admin.js';
import matchRoutes from './routes/match.js';
import mediaRoutes from './routes/media.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import geoRoutes from './routes/geo.js';
import profileRoutes from './routes/profiles.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Swagger UI Setup
setupSwagger(app);

// Rutas de Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BFF está funcionando correctamente' });
});

// Rutas modulares
app.use('/api/auth', authRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ubicaciones', geoRoutes);
app.use('/api/profiles', profileRoutes);

// Manejo de errores
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 BFF ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Disponible para el frontend en http://localhost:${PORT}/api`);
  console.log(`📚 Documentación Swagger:`);
  console.log(`   - Dashboard: http://localhost:${PORT}/docs`);
  console.log(`   - BFF API: http://localhost:${PORT}/api-docs`);
  console.log(`   - GeoService: http://localhost:${PORT}/geo-docs`);
  console.log(`   - UserService: http://localhost:${PORT}/user-docs`);
  console.log(`✅ Rutas disponibles:`);
  console.log(`   🔐 Auth:`);
  console.log(`   - POST   /api/auth/login`);
  console.log(`   - POST   /api/auth/register`);
  console.log(`   - POST   /api/auth/logout`);
  console.log(`   - GET    /api/auth/profile`);
  console.log(`   🐾 Pets:`);
  console.log(`   - GET    /api/pets/missing`);
  console.log(`   - POST   /api/pets/report`);
  console.log(`   - GET    /api/pets/:id`);
  console.log(`   - PUT    /api/pets/:id`);
  console.log(`   🏥 Clinics:`);
  console.log(`   - GET    /api/clinics`);
  console.log(`   - GET    /api/clinics/:id`);
  console.log(`   - POST   /api/clinics/:id/register-pet`);
  console.log(`   🤖 Microservicios Integrados:`);
  console.log(`   - POST   /api/match/analyze`);
  console.log(`   - POST   /api/media/upload`);
  console.log(`   - POST   /api/notifications/trigger-match`);
  console.log(`   - GET    /api/notifications/?user_id=X`);
  console.log(`   - POST   /api/notifications/:id/mark-read`);
  console.log(`   - GET    /api/chat/config`);
  console.log(`   - GET    /api/chat/room/:roomName/validate`);
  console.log(`   - GET    /api/profiles/:type`);
  console.log(`   - PUT    /api/profiles/:type`);
  console.log(`   Geo (proxy a :8003):`);
  console.log(`   - GET    /api/ubicaciones/`);
  console.log(`   - POST   /api/ubicaciones/`);
  console.log(`   - POST   /api/ubicaciones/buscar_cercanos/`);
  console.log(`   - GET    /api/ubicaciones/:id/obtener_cercanos/`);
});
