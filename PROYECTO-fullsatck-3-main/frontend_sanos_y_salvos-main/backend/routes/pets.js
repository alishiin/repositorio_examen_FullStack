import express from 'express';

const router = express.Router();

// GET /api/pets/missing
router.get('/missing', (req, res) => {
  // TODO: Obtener de base de datos con filtros opcionales
  res.json({
    success: true,
    count: 2,
    data: [
      {
        id: 1,
        name: 'Bruno',
        type: 'Perro',
        breed: 'Golden Retriever',
        age: '3 años',
        color: 'Dorado',
        description: 'Perro desaparecido en zona centro',
        image: 'https://images.unsplash.com/photo-1633722715463-d30628519d24?w=400&h=400&fit=crop',
        location: {
          lat: 40.7128,
          lng: -74.0060,
          area: 'Zona Centro'
        },
        reportDate: '2026-05-10T10:30:00Z',
        status: 'missing',
        reporter: { name: 'María', phone: '+1-555-0001' }
      },
      {
        id: 2,
        name: 'Luna',
        type: 'Gato',
        breed: 'Siames',
        age: '2 años',
        color: 'Gris y blanco',
        description: 'Gata desaparecida en barrio norte',
        image: 'https://images.unsplash.com/photo-1574158622682-e40ad41168d5?w=400&h=400&fit=crop',
        location: {
          lat: 40.7150,
          lng: -74.0070,
          area: 'Barrio Norte'
        },
        reportDate: '2026-05-08T14:15:00Z',
        status: 'missing',
        reporter: { name: 'Carlos', phone: '+1-555-0002' }
      }
    ]
  });
});

// POST /api/pets/report
router.post('/report', (req, res) => {
  const { name, type, breed, description, location, image } = req.body;
  
  if (!name || !type || !location) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nombre, tipo y ubicación son requeridos' 
    });
  }
  
  // TODO: Guardar en base de datos
  const petId = Math.floor(Math.random() * 100000);
  
  res.status(201).json({
    success: true,
    message: 'Mascota reportada exitosamente',
    petId,
    pet: {
      id: petId,
      name,
      type,
      breed,
      description,
      location,
      image,
      status: 'missing',
      reportDate: new Date().toISOString()
    }
  });
});

// GET /api/pets/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Obtener de base de datos
  res.json({
    success: true,
    data: {
      id,
      name: 'Bruno',
      type: 'Perro',
      breed: 'Golden Retriever',
      age: '3 años',
      color: 'Dorado',
      microchip: '123ABC456',
      vaccinated: true,
      description: 'Perro desaparecido en zona centro',
      image: 'https://images.unsplash.com/photo-1633722715463-d30628519d24?w=400&h=400&fit=crop',
      location: { lat: 40.7128, lng: -74.0060 },
      reportDate: '2026-05-10T10:30:00Z',
      status: 'missing',
      reporter: {
        name: 'María',
        phone: '+1-555-0001',
        email: 'maria@ejemplo.com'
      },
      clinics: [
        { id: 1, name: 'Clínica Centro', distance: '2km' },
        { id: 2, name: 'Clínica Norte', distance: '5km' }
      ]
    }
  });
});

// PUT /api/pets/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // TODO: Actualizar en base de datos
  res.json({
    success: true,
    message: 'Mascota actualizada',
    petId: id,
    newStatus: status
  });
});

export default router;
