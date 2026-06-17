import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar specs de Swagger
const loadSwaggerSpec = (filename) => {
  try {
    const file = fs.readFileSync(path.join(__dirname, `public/docs/${filename}`), 'utf8');
    return YAML.parse(file);
  } catch (error) {
    console.error(`Error cargando ${filename}:`, error.message);
    return {};
  }
};

// Specs
const bffSpec = loadSwaggerSpec('swagger-bff.yaml');
const geoSpec = loadSwaggerSpec('swagger-geoservice.yaml');
const userSpec = loadSwaggerSpec('swagger-userservice.yaml');

// Logs para debugging
console.log('✅ BFF Spec title:', bffSpec.info?.title || 'NO TITLE');
console.log('✅ GEO Spec title:', geoSpec.info?.title || 'NO TITLE');
console.log('✅ USER Spec title:', userSpec.info?.title || 'NO TITLE');

// Configurar Swagger UI
export const setupSwagger = (app) => {
  // Configurar opciones de CSS para cada API
  const bffOptions = {
    customCss: `
      .topbar { display: none; }
      .swagger-ui { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .swagger-ui .info .title { color: #2C3E50; font-weight: 700; }
      .swagger-ui .btn { background: #2980B9; border-color: #2980B9; }
      .swagger-ui .btn:hover { background: #1F5F8A; }
    `,
    swaggerOptions: { 
      displayOperationId: true, 
      filter: true, 
      showExtensions: true,
      url: '/api-docs/swagger-bff.json'
    }
  };

  const geoOptions = {
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info .title { color: #E67E22; font-weight: 700; }
      .swagger-ui .btn { background: #E67E22; border-color: #E67E22; }
      .swagger-ui .btn:hover { background: #D35400; }
    `,
    swaggerOptions: { 
      displayOperationId: true,
      url: '/geo-docs/swagger-geoservice.json'
    }
  };

  const userOptions = {
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info .title { color: #27AE60; font-weight: 700; }
      .swagger-ui .btn { background: #27AE60; border-color: #27AE60; }
      .swagger-ui .btn:hover { background: #229954; }
    `,
    swaggerOptions: { 
      displayOperationId: true,
      url: '/user-docs/swagger-userservice.json'
    }
  };

  // Servir archivos estáticos (CSS, JS, imágenes de Swagger UI)
  app.use('/api-docs', swaggerUi.serve);
  app.use('/geo-docs', swaggerUi.serve);
  app.use('/user-docs', swaggerUi.serve);

  // Rutas GET para cada página HTML de Swagger
  app.get('/api-docs/', (req, res) => {
    res.send(swaggerUi.generateHTML(bffSpec, bffOptions));
  });

  app.get('/geo-docs/', (req, res) => {
    res.send(swaggerUi.generateHTML(geoSpec, geoOptions));
  });

  app.get('/user-docs/', (req, res) => {
    res.send(swaggerUi.generateHTML(userSpec, userOptions));
  });

  // Registrar JSON endpoints
  app.get('/api-docs/swagger-bff.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(bffSpec);
  });

  app.get('/geo-docs/swagger-geoservice.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(geoSpec);
  });

  app.get('/user-docs/swagger-userservice.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(userSpec);
  });

  // Dashboard de APIs
  app.get('/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation - Sanos y Salvos</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 40px 20px;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          header {
            text-align: center;
            margin-bottom: 50px;
            animation: slideDown 0.6s ease-out;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          header h1 {
            font-size: 2.5rem;
            color: #2C3E50;
            margin-bottom: 10px;
          }
          
          header p {
            font-size: 1.1rem;
            color: #7F8C8D;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
          }
          
          .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-top: 4px solid;
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .card:nth-child(1) {
            border-top-color: #2980B9;
            animation-delay: 0.1s;
          }
          
          .card:nth-child(2) {
            border-top-color: #E67E22;
            animation-delay: 0.2s;
          }
          
          .card:nth-child(3) {
            border-top-color: #27AE60;
            animation-delay: 0.3s;
          }
          
          .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
          }
          
          .card h2 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #2C3E50;
          }
          
          .card p {
            color: #7F8C8D;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          
          .endpoints {
            background: #F8F9FA;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            max-height: 200px;
            overflow-y: auto;
          }
          
          .endpoint {
            display: flex;
            gap: 10px;
            padding: 8px 0;
            font-size: 0.9rem;
            border-bottom: 1px solid #E0E0E0;
          }
          
          .endpoint:last-child {
            border-bottom: none;
          }
          
          .method {
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.75rem;
            min-width: 50px;
            text-align: center;
          }
          
          .method.get {
            background: #3498DB;
          }
          
          .method.post {
            background: #27AE60;
          }
          
          .method.put {
            background: #F39C12;
          }
          
          .method.delete {
            background: #E74C3C;
          }
          
          .path {
            flex: 1;
            color: #2C3E50;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            word-break: break-all;
          }
          
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #2980B9;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid #2980B9;
          }
          
          .btn:hover {
            background: white;
            color: #2980B9;
          }
          
          .btn.geo {
            background: #E67E22;
            border-color: #E67E22;
          }
          
          .btn.geo:hover {
            background: white;
            color: #E67E22;
          }
          
          .btn.user {
            background: #27AE60;
            border-color: #27AE60;
          }
          
          .btn.user:hover {
            background: white;
            color: #27AE60;
          }
          
          .info {
            background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-top: 50px;
          }
          
          .info h3 {
            margin-bottom: 15px;
            font-size: 1.3rem;
          }
          
          .info p {
            margin-bottom: 10px;
            line-height: 1.8;
          }
          
          code {
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
          }
          
          .port {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            margin: 0 5px;
          }
          
          @media (max-width: 768px) {
            header h1 {
              font-size: 1.8rem;
            }
            
            .grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>🐾 Sanos y Salvos - API Documentation</h1>
            <p>Centro de documentación de APIs para el sistema de rescate de mascotas</p>
          </header>
          
          <div class="grid">
            <div class="card">
              <h2>🌐 Backend for Frontend (BFF)</h2>
              <p>Capa de integración que conecta el frontend con todos los microservicios. Proporciona endpoints optimizados para la aplicación React.</p>
              <div class="endpoints">
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/api/auth/login</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/api/auth/register</span>
                </div>
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/api/pets/missing</span>
                </div>
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/api/clinics</span>
                </div>
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/api/admin/dashboard</span>
                </div>
              </div>
              <p><strong>Puerto:</strong> <span class="port">5000</span></p>
              <a href="/api-docs" class="btn">Ver Swagger UI →</a>
            </div>
            
            <div class="card">
              <h2>📍 GeoService API</h2>
              <p>Servicio especializado en geolocalización. Gestiona ubicaciones de reportes y búsquedas por proximidad usando algoritmo Haversine.</p>
              <div class="endpoints">
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/api/ubicaciones</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/api/ubicaciones</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/api/ubicaciones/buscar_cercanos</span>
                </div>
                <div class="endpoint">
                  <span class="method put">PUT</span>
                  <span class="path">/api/ubicaciones/{id}</span>
                </div>
              </div>
              <p><strong>Puerto:</strong> <span class="port">8001</span></p>
              <a href="/geo-docs" class="btn geo">Ver Swagger UI →</a>
            </div>
            
            <div class="card">
              <h2>👥 UserService API</h2>
              <p>Gestión completa de usuarios y autenticación con JWT. Maneja registros, perfiles y tokens de seguridad.</p>
              <div class="endpoints">
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/users</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/users</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/token</span>
                </div>
                <div class="endpoint">
                  <span class="method put">PUT</span>
                  <span class="path">/users/{id}</span>
                </div>
              </div>
              <p><strong>Puerto:</strong> <span class="port">8002</span></p>
              <a href="/user-docs" class="btn user">Ver Swagger UI →</a>
            </div>
          </div>
          
          <div class="info">
            <h3>📝 Información de Desarrollo</h3>
            <p><strong>Ambiente:</strong> Desarrollo Local | <strong>Fecha:</strong> 12/05/2026</p>
            <p>
              <strong>Servidores Activos:</strong><br>
              • BFF: <code>http://localhost:5000</code><br>
              • GeoService: <code>http://localhost:8001</code><br>
              • UserService: <code>http://localhost:8002</code><br>
              • AuthService: <code>http://localhost:8003</code><br>
              • Frontend: <code>http://localhost:5174</code>
            </p>
            <p>
              <strong>Archivos de Documentación:</strong><br>
              • <code>API_DOCUMENTATION.md</code> - Documentación completa<br>
              • <code>QUICK_API_REFERENCE.md</code> - Referencia rápida<br>
              • <code>swagger-*.yaml</code> - Especificaciones OpenAPI
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
  });
};

export default setupSwagger;
