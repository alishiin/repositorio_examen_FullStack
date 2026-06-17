import express from 'express';
import httpProxy from 'http-proxy';

const router = express.Router();
const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || 'http://localhost:8005';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000
});

// FIX: express.json() consume el body antes que http-proxy pueda leerlo.
// Si la request es JSON, re-serializamos req.body al stream del proxy.
// Multipart NO se ve afectado (no entra al if).
proxy.on('proxyReq', (proxyReq, req) => {
  if (!req.body || typeof req.body !== 'object') return;
  const contentType = proxyReq.getHeader('Content-Type') || '';
  if (!String(contentType).includes('application/json')) return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader('Content-Type', 'application/json');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
});

proxy.on('error', (err, req, res) => {
  console.error('Match Proxy Error:', err.message);
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      message: 'Error conectando con Match Service',
      error: err.message
    });
  }
});

/**
 * POST /api/match/analyze
 * Proxy multipart (upload de imagen) a Match Service.
 */
router.post('/analyze', (req, res) => {
  req.url = '/api/match/analyze/';
  proxy.web(req, res, { target: MATCH_SERVICE_URL });
});

/**
 * POST /api/match/find-matches
 * Cotejo de un reporte contra los del tipo opuesto (JSON body).
 */
router.post('/find-matches', (req, res) => {
  req.url = '/api/match/find-matches/';
  proxy.web(req, res, { target: MATCH_SERVICE_URL });
});

export default router;
