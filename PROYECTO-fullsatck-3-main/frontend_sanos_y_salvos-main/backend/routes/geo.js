// Proxy transparente del BFF hacia GeoService (:8003).
// Reescribe /api/ubicaciones/* y lo enruta al microservicio de geo.
import express from 'express';
import httpProxy from 'http-proxy';

const router = express.Router();
const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'http://localhost:8003';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000,
});

proxy.on('error', (err, req, res) => {
  console.error('Geo Proxy Error:', err.message);
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      message: 'Error conectando con Geo Service',
      error: err.message,
    });
  }
});

// Proxy transparente: el mount path en server.js es /api/ubicaciones,
// asi que reconstruimos la URL absoluta antes de reenviar.
router.all('/*', (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: GEO_SERVICE_URL });
});

export default router;
