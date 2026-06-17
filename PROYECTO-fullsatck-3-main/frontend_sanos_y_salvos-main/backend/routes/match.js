import express from 'express';
import httpProxy from 'http-proxy';

const router = express.Router();
const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || 'http://localhost:8005';

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
    message: 'Error conectando con Match Service',
    error: err.message
  });
});

/**
 * POST /api/match/analyze
 * Proxy transparente a Match Service
 */
router.post('/analyze', (req, res) => {
  // Reescribir la URL para que vaya a /api/match/analyze/
  req.url = '/api/match/analyze/';
  proxy.web(req, res, { target: MATCH_SERVICE_URL });
});

export default router;
