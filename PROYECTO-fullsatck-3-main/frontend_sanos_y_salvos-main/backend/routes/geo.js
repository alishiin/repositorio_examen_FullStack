// Proxy transparente del BFF hacia GeoService (:8003).
// Reescribe /api/ubicaciones/* y lo enruta al microservicio de geo.
import express from 'express';
import httpProxy from 'http-proxy';

const router = express.Router();
const GEO_SERVICE_URL = (() => {
  const rawUrl = (process.env.GEO_SERVICE_URL || 'http://localhost:8003').replace(/\/$/, '');
  return rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;
})();

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000,
});

// FIX CRITICO: re-escribir el body JSON al stream proxy.
// express.json() en server.js ya consumio el body original, asi que
// http-proxy enviaria un stream vacio y la request se cuelga hasta
// timeout (ERR_EMPTY_RESPONSE en el cliente). Aqui lo re-serializamos
// desde req.body. NO aplica a multipart (match/media), solo a JSON.
proxy.on('proxyReq', (proxyReq, req) => {
  if (!req.body || typeof req.body !== 'object') return;
  const contentType = proxyReq.getHeader('Content-Type') || 'application/json';
  if (!String(contentType).includes('application/json')) return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader('Content-Type', 'application/json');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
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
