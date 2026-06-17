import express from 'express';
import httpProxy from 'http-proxy';

const router = express.Router();
const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:8006';

// Crear proxy
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000
});

// Manejar errores del proxy
proxy.on('error', (err, req, res) => {
  console.error('❌ Proxy Error:', err.message);
  res.status(503).json({
    success: false,
    message: 'Error conectando con Media Service',
    error: err.message
  });
});

/**
 * POST /api/media/upload
 * Proxy transparente a Media Service
 */
router.post('/upload', (req, res) => {
  // Reescribir la URL para que vaya a /api/media/upload/
  req.url = '/api/media/upload/';
  proxy.web(req, res, { target: MEDIA_SERVICE_URL });
});

export default router;
