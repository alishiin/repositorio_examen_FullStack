import express from 'express';
import axios from 'axios';

const router = express.Router();
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8007';

/**
 * GET /api/notifications/?user_id=X
 * Lista notificaciones del usuario (in-app, FASE 1B).
 */
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Falta query param: user_id' });
    }
    const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/`, {
      params: { user_id },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en GET notifications:', error.message);
    const upstream = error.response;
    res.status(upstream?.status || 500).json({
      success: false,
      message: upstream?.data?.error || 'Error en Notification Service',
      error: error.message,
    });
  }
});

/**
 * POST /api/notifications/:id/mark-read
 * Marca una notificacion como leida (FASE 1B).
 */
router.post('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/${id}/mark-read/`,
      {},
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en POST mark-read:', error.message);
    const upstream = error.response;
    res.status(upstream?.status || 500).json({
      success: false,
      message: upstream?.data?.error || 'Error en Notification Service',
      error: error.message,
    });
  }
});

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
