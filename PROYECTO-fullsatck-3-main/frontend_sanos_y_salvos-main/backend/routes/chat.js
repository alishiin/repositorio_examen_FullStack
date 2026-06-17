import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/chat/config
 * Retorna la configuración para conectarse al Chat WebSocket Service
 * Respuesta: { wsUrl, message }
 */
router.get('/config', (req, res) => {
  try {
    const wsUrl = process.env.CHAT_SERVICE_URL || 'ws://localhost:8004';
    
    res.json({
      success: true,
      wsUrl,
      message: 'Configuración de chat obtenida exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración de chat:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo configuración de chat', 
      error: error.message 
    });
  }
});

/**
 * GET /api/chat/room/:roomName/validate
 * Valida si el usuario puede entrar a una sala de chat
 * Parámetros: roomName (nombre de la sala)
 * Respuesta: { wsUrl, room, authorized, message }
 */
router.get('/room/:roomName/validate', (req, res) => {
  try {
    const { roomName } = req.params;
    const wsUrl = process.env.CHAT_SERVICE_URL || 'ws://localhost:8004';
    
    // TODO: Agregar lógica de autorización según usuario
    const authorized = true; // Por ahora siempre autorizado
    
    res.json({
      success: true,
      wsUrl,
      room: roomName,
      authorized,
      wsEndpoint: `${wsUrl}/ws/chat/${roomName}/`,
      message: 'Acceso a sala de chat autorizado'
    });
  } catch (error) {
    console.error('❌ Error validando acceso a sala:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error validando acceso a sala', 
      error: error.message 
    });
  }
});

export default router;
