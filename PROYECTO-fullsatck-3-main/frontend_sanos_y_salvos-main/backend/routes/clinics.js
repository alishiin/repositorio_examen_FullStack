import express from 'express';

const router = express.Router();

// GET /api/clinics
router.get('/', (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  
  // TODO: Filtrar por geolocalización si se proporcionan coordenadas
  res.json({
    success: true,
    count: 5,
    data: [
      {
        id: 1,
        name: 'Clínica Veterinaria Centro',
        type: 'Clínica General',
        address: 'Calle Principal 123',
        phone: '+1-555-0001',
        email: 'centro@clinica.com',
        hours: { open: '09:00', close: '18:00' },
        certified: true,
        rating: 4.8,
        reviews: 125,
        services: ['Consulta General', 'Cirugía', 'Vacunación', 'Rescate'],
        location: { lat: 40.7128, lng: -74.0060 },
        emergency: true,
        image: 'https://images.unsplash.com/photo-1631217269769-1aa6d5a9d3e7?w=400&h=300&fit=crop'
      },
      {
        id: 2,
        name: 'Veterinaria Mascotas Felices',
        type: 'Clínica Especializada',
        address: 'Avenida Secundaria 456',
        phone: '+1-555-0002',
        email: 'mascotas@felices.com',
        hours: { open: '08:00', close: '20:00' },
        certified: true,
        rating: 4.6,
        reviews: 98,
        services: ['Consulta General', 'Dermatología', 'Cirugía', 'Rescate'],
        location: { lat: 40.7150, lng: -74.0070 },
        emergency: true,
        image: 'https://images.unsplash.com/photo-1601052864906-d96b62a55bf9?w=400&h=300&fit=crop'
      },
      {
        id: 3,
        name: 'Clínica de Urgencias 24/7',
        type: 'Urgencias',
        address: 'Calle Emergencia 789',
        phone: '+1-555-0003',
        email: 'urgencias@24horas.com',
        hours: { open: '00:00', close: '23:59' },
        certified: true,
        rating: 4.9,
        reviews: 210,
        services: ['Urgencias', 'Cirugía de Emergencia', 'Rescate', 'Internación'],
        location: { lat: 40.7100, lng: -74.0050 },
        emergency: true,
        image: 'https://images.unsplash.com/photo-1587554801637-e91305456cd6?w=400&h=300&fit=crop'
      }
    ]
  });
});

// GET /api/clinics/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Obtener de base de datos
  res.json({
    success: true,
    data: {
      id,
      name: 'Clínica Veterinaria Centro',
      type: 'Clínica General',
      address: 'Calle Principal 123',
      phone: '+1-555-0001',
      email: 'centro@clinica.com',
      website: 'www.clinicacentro.com',
      hours: {
        monday: '09:00 - 18:00',
        tuesday: '09:00 - 18:00',
        wednesday: '09:00 - 18:00',
        thursday: '09:00 - 18:00',
        friday: '09:00 - 20:00',
        saturday: '10:00 - 17:00',
        sunday: 'Cerrado'
      },
      certified: true,
      certificationNumber: 'VET-2024-001234',
      rating: 4.8,
      reviews: 125,
      services: [
        'Consulta General',
        'Cirugía',
        'Vacunación',
        'Odontología',
        'Rescate y Adopción'
      ],
      veterinarians: [
        { name: 'Dr. Juan Pérez', specialty: 'General', experience: '15 años' },
        { name: 'Dra. María López', specialty: 'Cirugía', experience: '12 años' }
      ],
      location: { lat: 40.7128, lng: -74.0060 },
      emergency: true,
      image: 'https://images.unsplash.com/photo-1631217269769-1aa6d5a9d3e7?w=600&h=400&fit=crop'
    }
  });
});

// POST /api/clinics/:id/register-pet
router.post('/:id/register-pet', (req, res) => {
  const { clinicId } = req.params;
  const { petId, petName, ownerName } = req.body;
  
  // TODO: Guardar registro de mascota encontrada en la clínica
  res.status(201).json({
    success: true,
    message: 'Mascota registrada en la clínica exitosamente',
    registrationId: Math.floor(Math.random() * 100000),
    clinic: clinicId,
    pet: { petId, petName, ownerName },
    registrationDate: new Date().toISOString()
  });
});

export default router;
