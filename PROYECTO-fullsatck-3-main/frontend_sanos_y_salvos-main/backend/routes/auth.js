import express from 'express';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email y contraseña son requeridos' 
    });
  }
  
  // TODO: Validar contra base de datos
  res.json({
    success: true,
    token: 'jwt-token-ejemplo',
    user: { 
      id: 1,
      email, 
      name: 'Usuario Test'
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos los campos son requeridos' 
    });
  }
  
  // TODO: Guardar en base de datos
  res.json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: { email, name }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Sesión cerrada exitosamente' 
  });
});

// GET /api/auth/profile
router.get('/profile', (req, res) => {
  // TODO: Verificar token y obtener perfil
  res.json({
    success: true,
    user: {
      id: 1,
      email: 'usuario@ejemplo.com',
      name: 'Usuario Test',
      phone: '+1-555-0000',
      avatar: '/api/images/avatar.jpg'
    }
  });
});

export default router;
