# Sanos y Salvos - Plataforma de Mascotas Perdidas

## Equipo
- Yamil Apablaza
- Alvaro Del Canto
- Santiago Vargas

**Asignatura**: Desarrollo Fullstack III (DSY1106) - Parcial 3
**Profesor**: Krystian Reymon Delgado Guzman

## Descripcion
Plataforma web para reportar y encontrar mascotas perdidas, basada en arquitectura de **microservicios** con un **BFF** (Backend-For-Frontend), frontend **React**, **7 microservicios Django** y APIs externas (Google Gemini, Mapbox, The Dog API).

## Stack Tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 5 + Mapbox GL + Leaflet |
| BFF | Node.js 20 + Express + Swagger + http-proxy |
| Backend | Django 5 + DRF + SimpleJWT + Channels + Pillow |
| DB | SQLite (dev) / PostgreSQL + PostGIS (prod) |
| IA | Google Gemini (analisis de imagenes de mascotas) |
| Testing | pytest, Jest 30 (ESM), Vitest 2, React Testing Library, Supertest |

## Como levantar todo localmente

### Pre-requisitos
- Python 3.11+ (recomendado 3.13)
- Node.js 18+
- `uv` (`pip install uv`) o `pip` estandar

### 1. Microservicios Django (un terminal por servicio)

#### AuthService (puerto 8001)
```bash
cd PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/AuthService
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

#### UserService (puerto 8002)
```bash
cd PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/UserService
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

#### GeoService (puerto 8003)
```bash
cd PROYECTO-fullsatck-3-main/apis/sanosysalvos-geoservice-main
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8003
```

#### ChatService (puerto 8004)
```bash
cd PROYECTO-fullsatck-3-main/apis/chat-services-main
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8004 chat_service_proj.asgi:application
```

#### MatchService (puerto 8005)
```bash
cd PROYECTO-fullsatck-3-main/apis/MatchService-main
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY="<tu-key>"
python manage.py migrate
python manage.py runserver 8005
```

#### MediaService (puerto 8006)
```bash
cd PROYECTO-fullsatck-3-main/apis/Media-Service-main
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8006
```

#### NotificationService (puerto 8007)
```bash
cd PROYECTO-fullsatck-3-main/apis/NotificacionesServices-main
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8007
```

### 2. BFF (puerto 5000)
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main/backend
npm install
npm start  # puerto 5000
```

### 3. Frontend (puerto 5173)
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

## Mapa de puertos

| Componente | Puerto |
|---|---|
| Frontend (Vite) | 5173 |
| BFF (Express) | 5000 |
| AuthService | 8001 |
| UserService | 8002 |
| GeoService | 8003 |
| ChatService (WS) | 8004 |
| MatchService | 8005 |
| MediaService | 8006 |
| NotificationService | 8007 |

> **Nota de integracion**: el Frontend habla **directo** con AuthService (`:8001`)
> y UserService (`:8002`). Los demas microservicios se acceden **via BFF**
> (`:5000`) por el patron API Gateway. Esto es temporal hasta que las rutas
> `/api/auth/*` y `/api/pets/*` del BFF dejen de ser stubs locales.

## Documentacion del entregable

| Documento | Ubicacion |
|---|---|
| **Diagrama de arquitectura** | `entrega/01-arquitectura/arquitectura.md` (+ `.html` standalone) |
| **Estrategia de persistencia** | `entrega/02-persistencia/persistencia.md` |
| **Informe de pruebas** | `entrega/03-pruebas/informe-pruebas.md` |
| **Coleccion API (Postman + .http)** | `entrega/04-api-collection/` |
| **Repositorios** | `entrega/repositorios.txt` |

## Tests

| Componente | Tests | Coverage |
|---|---:|---:|
| AuthService | 11 | 100% |
| UserService | 65 | 100% |
| MatchService | 19 | 100% |
| MediaService | 16 | 97.6% |
| NotificationService | 30 | 99.1% |
| ChatService | 15 | 94.6% |
| GeoService | 56 | 87.1% |
| BFF Node | 41 | 96.2% |
| Frontend React | 84 | 98.6% |
| **TOTAL** | **337** | **>=94% promedio** |

Detalle completo en `entrega/03-pruebas/informe-pruebas.md`.

## Swagger / API docs
- **BFF Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **BFF Dashboard**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **Django Admin** (cada microservicio): `http://localhost:<puerto>/admin/`

## Patrones de diseno aplicados
- **API Gateway** (BFF Express)
- **Repository** (Django ORM)
- **Circuit Breaker** (GeoService -> UserService/PetService)
- **Factory Method** (creacion de tokens JWT en AuthService)
- **Microservices Architecture** (DB-per-service, 7 servicios independientes)

Ver detalle en `entrega/01-arquitectura/arquitectura.md`.

## Defensa oral
- Guion: `entrega/DEFENSA.md` (a generar en FASE 4)
- Preguntas frecuentes: `entrega/PREGUNTAS_FRECUENTES.md` (a generar en FASE 4)

## Licencia
Uso academico - Parcial 3 DSY1106 - 2026.
