# BFF - Sanos y Salvos

**Backend-For-Frontend** (Express) que centraliza el acceso a los 7 microservicios Django desde el frontend React.

## Stack
- Node.js 20 + Express 5
- `axios` (calls REST a microservicios)
- `http-proxy` (proxies multipart para Match / Media)
- `swagger-jsdoc` + `swagger-ui-express` (docs interactivas)
- **Jest 30 (ESM)** + Supertest 7

## Puerto
- **5000**

## Rutas

| Mount path | Microservicio destino | Estrategia |
|---|---|---|
| `/api/auth/*` | AuthService :8001 | Stub local (TODO: integrar) |
| `/api/pets/*` | PetService (no implementado) | Stub local |
| `/api/clinics/*` | Veterinarias | Stub local |
| `/api/admin/*` | UserService + GeoService | Composite (fs + fetch) |
| `/api/match/*` | MatchService :8005 | http-proxy |
| `/api/media/*` | MediaService :8006 | http-proxy (multipart) |
| `/api/notifications/*` | NotificationService :8007 | axios |
| `/api/chat/*` | ChatService :8004 | Config + validacion |
| `/api/health` | - | Self |

## Como levantar
```bash
npm install
npm start          # produccion (puerto 5000)
npm run dev        # con --watch
```

## Variables de entorno (opcional)
```bash
MATCH_SERVICE_URL=http://localhost:8005
MEDIA_SERVICE_URL=http://localhost:8006
NOTIFICATION_SERVICE_URL=http://localhost:8007
CHAT_SERVICE_URL=ws://localhost:8004
USER_SERVICE_URL=http://localhost:8002
GEO_SERVICE_URL=http://localhost:8003/api
```

## Swagger / Docs
- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Dashboard alternativo**: [http://localhost:5000/docs](http://localhost:5000/docs)

## Tests
```bash
npm test                    # ejecuta todos los tests
npm run test:coverage       # con reporte de cobertura
```
**Cobertura actual: 96.2% / 41 tests pasados** (rutas in-scope: auth, pets, clinics, chat, notifications, match, media; admin parcial).

- Mocks: `axios` y `http-proxy` (via `jest.unstable_mockModule` para ESM).
- Reporte HTML en `./coverage/index.html`.

## Notas tecnicas
- **ESM nativo** (`"type": "module"`). Por eso los tests requieren `NODE_OPTIONS=--experimental-vm-modules`.
- Los routes que usan `http-proxy` reescriben la URL agregando `/api/<servicio>/` antes de pasar al target.
