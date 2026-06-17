# Frontend - Sanos y Salvos

SPA en **React 19** construida con **Vite 5**. Consume el BFF en `http://localhost:5000/api`.

## Stack
- React 19 + Vite 5.4
- React Router DOM (rutas SPA)
- Mapbox GL + Leaflet (visualizacion geografica)
- Context API + custom hooks por dominio
- **Vitest 2** + Testing Library + jsdom

## Puerto
- **5173** (Vite dev server)

## Estructura

```
src/
├── api/           # client.js (wrapper fetch) + clients por servicio
├── components/    # Header, Footer, Hero, ReportForm, MapSection, Chat, Notifications, ...
├── context/       # AuthContext (JWT en localStorage)
├── hooks/         # useAuth, useChat, useMediaUpload, useMatchAnalysis,
│                  # useNotifications, useGeoService
├── pages/         # Home, Login, Reportar, Cuenta, Mapa, Chat, ...
├── services/      # api.js (clientes especificos por microservicio)
└── App.jsx
```

## Como levantar
```bash
npm install
npm run dev        # puerto 5173
npm run build      # produccion -> dist/
npm run preview    # preview del build
```

## Variables de entorno
Crear `.env` (basado en `.env.example`):
```bash
VITE_API_URL=http://localhost:5000/api
VITE_BFF_URL=http://localhost:5000
VITE_GEO_SERVICE_URL=http://localhost:8003/api
VITE_USER_SERVICE_URL=http://localhost:8002
VITE_AUTH_SERVICE_URL=http://localhost:8001
VITE_CHAT_WS_URL=ws://localhost:8004
VITE_MAPBOX_TOKEN=<tu-token-mapbox>
```

## Tests
```bash
npm test                  # ejecuta todos los tests
npm run test:watch        # modo watch
npm run test:coverage     # con reporte HTML
```
**Cobertura actual: 98.6% / 84 tests pasados.**

Tests cubren:
- `AuthContext` (login/logout/hidratacion desde localStorage).
- Todos los hooks personalizados (`useAuth`, `useMediaUpload`, `useMatchAnalysis`, `useNotifications`, `useGeoService`, `useChat`).
- Cliente API (`api/client.js`).
- Componentes: `ChatRoomList`, `NotificationBell`, `NotificationList`.

Excluidos por scope (requieren E2E con Playwright):
- `ChatWindow.jsx` (WebSocket activo)
- `ReportForm.jsx` (mapas + multipart)

Reporte HTML en `./coverage/index.html`.

## Notas tecnicas
- **Downgrade Vite 8 -> Vite 5.4**: la version 8 con rolldown experimental rompia en Node 20 (bug `styleText` / native binding). Vite 5 es estable y funcional con React 19.
- Vitest necesita `vite>=5` y se configura en `vitest.config.js` (jsdom + setupFiles).
