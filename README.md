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

```bash
./start-all.sh
```
Primera vez: 2-3 min (crea venvs e instala deps). Siguientes: ~10s.
Auto-crea superusers `admin/admin123` en los 7 microservicios.
Abre el navegador en http://localhost:5173 automaticamente.
Logs en `logs/<servicio>.log`. PIDs en `.pids/`.

### Opciones de start-all.sh

| Flag | Descripcion |
|---|---|
| `--fresh` | Borra TODAS las DBs SQLite, re-migra desde 0, crea admins + usuarios demo. Pide confirmacion. |
| `--no-seed` | No corre seed-admins (no crea superusers automaticamente). |
| `--no-browser` | No abre el navegador al final. |
| `-h`, `--help` | Muestra ayuda. |

Ejemplos:
```bash
./start-all.sh                  # arranca normal + crea admins
./start-all.sh --fresh          # reset total: borra DBs + migra + admins + usuarios demo
./start-all.sh --no-browser     # arranca sin abrir navegador (util para CI/headless)
```

### Opcion manual (una terminal por servicio)
Ver `entrega/05-demo/MANUAL_COMMANDS.md` para los comandos paso a paso.

### Detener todo
```bash
./stop-all.sh
```

## Credenciales por defecto

| Rol | Usuario | Password | Acceso |
|---|---|---|---|
| Admin de cada microservicio | `admin` | `admin123` | `http://localhost:<puerto>/admin/` |
| Usuario demo (solo con `--fresh`) | `demo@example.cl` | `demo1234` | Login del frontend |

## Datos de demostracion manual

Si NO usaste `--fresh` pero queres crear los usuarios demo despues:
```bash
./entrega/05-demo/seed-demo.sh
```
Crea: `admin@sanosysalvos.cl / admin123` (superuser de UserService) y `demo@example.cl / demo1234`.

Si por algun motivo el admin de algun microservicio no te deja entrar, re-correr:
```bash
./entrega/05-demo/seed-admins.sh
```
Idempotente. Recrea `admin/admin123` en los 7 microservicios.

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

## Panel administrativo

El proyecto tiene DOS interfaces administrativas con propositos distintos:

### 1. Panel admin React (http://localhost:5173/admin)

UI custom para moderacion de reportes. Login: `admin` / `admin123`. Funcionalidades:

- Dashboard con metricas (total perdidos, encontrados, pendientes, recuperados, actividad reciente)
- Lista de reportes con filtros por estado de moderacion, tipo de reporte y busqueda libre
- Detalle de cada reporte con:
  - **Aprobar / Rechazar** reportes pendientes (workflow de moderacion del BFF)
  - **Marcar como recuperada** una vez aprobada
  - **Editar todos los campos**: titulo, descripcion, tipo_reporte (perdido/encontrado), tipo_animal, raza, color, tamano y estado (activo/resuelto/cerrado)
  - **Eliminar** reporte (borra en GeoService + marca como eliminado en admin-state.json)
  - Notas administrativas internas

El panel React **NO** es el admin de Django: es una capa propia del BFF que combina datos reales de GeoService con metadata de moderacion en `backend/data/admin-state.json`.

### 2. Django admin (http://localhost:<puerto>/admin/)

Acceso CRUD directo a la base de datos de cada microservicio. Util para inspeccion / fixes puntuales:

- http://localhost:8001/admin/  - Auth
- http://localhost:8002/admin/  - Users
- http://localhost:8003/admin/  - Reportes geolocalizados (cambiar estado activo/resuelto/cerrado inline)
- http://localhost:8005/admin/  - Match results y analisis IA
- http://localhost:8007/admin/  - Notificaciones

Login en cualquiera: `admin` / `admin123` (creado automaticamente por `./start-all.sh`).

### Diferencia entre los campos de estado

El proyecto tiene **tres** dimensiones de estado que conviene no confundir:

| Campo | Donde vive | Valores | Proposito |
|---|---|---|---|
| `tipo_reporte` | GeoService DB (Location) | perdido / encontrado | Clasificacion original del reporte |
| `estado` | GeoService DB (Location) | activo / resuelto / cerrado | Resolucion del caso (vigente / mascota devuelta / cerrado) |
| `status` | BFF `admin-state.json` | pending / approved / rejected / recovered | Workflow de moderacion administrativa |

Cuando una mascota perdida aparece, el admin tiene dos opciones equivalentes:

1. Cambiar `tipo_reporte` de `perdido` a `encontrado` (re-clasificar el reporte)
2. Cambiar `estado` de `activo` a `resuelto` (cerrar el caso sin re-clasificar)

Ambas se pueden hacer desde el modal de edicion del panel React o desde el Django admin de GeoService.



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
