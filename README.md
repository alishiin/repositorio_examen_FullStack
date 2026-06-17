# Sanos y Salvos

Plataforma fullstack para reportar y encontrar mascotas perdidas en Chile.
Arquitectura de microservicios con BFF (Backend-For-Frontend) y 7 microservicios Django.

## Equipo
- Yamil Apablaza
- Alvaro Del Canto
- Santiago Vargas

Asignatura: Desarrollo Fullstack III (DSY1106) - Parcial 3
Profesor: Krystian Reymon Delgado Guzman

## Stack
- Frontend: React 19 + Vite 5 + Mapbox GL
- BFF: Node.js 20 + Express + http-proxy + Swagger
- Backend: Django 5 + DRF + SimpleJWT + Channels
- DB: SQLite (dev) / PostgreSQL + PostGIS (prod)
- IA: Google Gemini (analisis de imagenes, opcional)
- Real-time: WebSockets via Daphne (ChatService)
- Testing: pytest, Jest 30, Vitest 2, ~395 tests, >=94% cov promedio

## Componentes y puertos
| Componente | Puerto |
|---|---|
| Frontend (React) | 5173 |
| BFF (Express) | 5000 |
| AuthService | 8001 |
| UserService | 8002 |
| GeoService | 8003 |
| ChatService (WS) | 8004 |
| MatchService | 8005 |
| MediaService | 8006 |
| NotificationService | 8007 |

Nota de integracion: el Frontend habla DIRECTO con AuthService y UserService.
Los demas microservicios se acceden via BFF por el patron API Gateway.

## Pre-requisitos
- Python 3.11+ (recomendado 3.13)
- Node.js 18+
- uv (`pip install uv`) o pip estandar
- macOS o Linux (Windows con WSL o Git Bash)

## Ejecutar desde cero

### Opcion A: Automatico (recomendado)
```bash
./start-all.sh
```
Primera vez: 2-3 min (crea venvs e instala deps). Siguientes: ~10s.
Logs en `logs/<servicio>.log`. PIDs en `.pids/`.

### Opcion B: Manual (una terminal por servicio)
Ver `entrega/05-demo/MANUAL_COMMANDS.md` para los comandos paso a paso.

### Detener todo
```bash
./stop-all.sh
```

## Datos de demostracion
```bash
./entrega/05-demo/seed-demo.sh
```
Crea: `admin@sanosysalvos.cl / admin123` (superuser) y `demo@example.cl / demo1234`.

## Variables de entorno

### MatchService (opcional, para analisis IA)
Crear `apis/MatchService-main/.env`:
```
GEMINI_API_KEY=tu-key-de-google-aistudio
```
Sin esta key el analisis IA queda en modo degradado (no rompe el flujo).

### Frontend
Ver `frontend_sanos_y_salvos-main/.env.example`. Defaults locales funcionan sin tocar nada.

## Tests
```bash
# Por servicio Django
cd apis/<servicio> && source .venv/bin/activate && pytest

# Frontend React
cd frontend_sanos_y_salvos-main && npm test

# BFF Node
cd frontend_sanos_y_salvos-main/backend && npm test
```

## Migraciones
Las aplica `start-all.sh` automaticamente. Manualmente:
```bash
cd apis/<servicio> && source .venv/bin/activate && python manage.py migrate
```

## Documentacion
| Documento | Ubicacion |
|---|---|
| Como funciona el sistema | `entrega/COMO_FUNCIONA.md` |
| Arquitectura | `entrega/01-arquitectura/` |
| Persistencia | `entrega/02-persistencia/` |
| Informe de pruebas | `entrega/03-pruebas/` |
| API Collection (Postman + .http) | `entrega/04-api-collection/` |
| Smoke test checklist | `entrega/05-demo/SMOKE_TEST_CHECKLIST.md` |
| Repositorios | `entrega/repositorios.txt` |

## Acceso al admin Django
- http://localhost:8001/admin/  - Auth (crear superuser: `python manage.py createsuperuser`)
- http://localhost:8002/admin/  - Users
- http://localhost:8003/admin/  - Reportes geolocalizados (cambiar estado activo/resuelto/cerrado)
- http://localhost:8005/admin/  - Match results y analisis IA
- http://localhost:8007/admin/  - Notificaciones

## Swagger / API docs
- BFF Swagger UI: http://localhost:5000/api-docs
- BFF Dashboard: http://localhost:5000/docs

## Patrones de diseno aplicados
- API Gateway (BFF Express)
- Repository (Django ORM)
- Circuit Breaker (GeoService -> UserService)
- Factory Method (tokens JWT en AuthService)
- Microservices Architecture (DB-per-service, 7 servicios independientes)

Detalle en `entrega/01-arquitectura/arquitectura.md`.

## Troubleshooting
- `lsof -i :<puerto>` para ver que servicio escucha
- `tail -f logs/<servicio>.log` para logs en vivo
- Si Daphne falla en chat, verificar venv: `cd apis/chat-services-main && source .venv/bin/activate && pip install daphne`
- Frontend en blanco: Cmd+R o limpiar cache del navegador

## Licencia
Uso academico - Parcial 3 DSY1106 - 2026.
