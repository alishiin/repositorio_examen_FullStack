import express from 'express';
import axios from 'axios';

const router = express.Router();
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8007';

/**
 * POST /api/notifications/trigger-match
 * Envía una notificación de match a un usuario
 * Body: { user_id, user_email, match_id, pet_name }
 */
router.post('/trigger-match', async (req, res) => {
  try {
    const { user_id, user_email, match_id, pet_name } = req.body;

    // Validar datos requeridos
    if (!user_id || !user_email || !match_id || !pet_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros requeridos: user_id, user_email, match_id, pet_name' 
      });
    }

    const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/trigger-match/`, {
      user_id,
      user_email,
      match_id,
      pet_name
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Error en Notification Service:', error.message);
    if (error.response?.status) {
      res.status(error.response.status).json({ 
        success: false, 
        message: error.response.data?.error || 'Error en Notification Service', 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error en Notification Service', 
        error: error.message 
      });
    }
  }
});

export default router;
