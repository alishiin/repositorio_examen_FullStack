# Comandos manuales - Sanos y Salvos

Alternativa a `start-all.sh` si prefieres **una terminal por servicio** para ver los logs en vivo y debuggear con calma.

> Asume que ya creaste los venvs (la primera vez correr `start-all.sh` te los crea; despues puedes usar este modo).

---

## Microservicios Django (terminal por servicio)

### AuthService (puerto 8001)
```bash
cd PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/AuthService
source .venv/bin/activate
python manage.py migrate
python manage.py runserver 8001
```

### UserService (puerto 8002)
```bash
cd PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/UserService
source .venv/bin/activate
python manage.py migrate
python manage.py runserver 8002
```

### GeoService (puerto 8003)
```bash
cd PROYECTO-fullsatck-3-main/apis/sanosysalvos-geoservice-main
source .venv/bin/activate
python manage.py migrate
python manage.py runserver 8003
```

### ChatService (puerto 8004, ASGI con Daphne)
```bash
cd PROYECTO-fullsatck-3-main/apis/chat-services-main
source .venv/bin/activate
python manage.py migrate
daphne -b 0.0.0.0 -p 8004 chat_service_proj.asgi:application
```

### MatchService (puerto 8005)
```bash
cd PROYECTO-fullsatck-3-main/apis/MatchService-main
source .venv/bin/activate
# Carga la GEMINI_API_KEY del .env (si no, modo degradado):
export $(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py runserver 8005
```

### MediaService (puerto 8006)
```bash
cd PROYECTO-fullsatck-3-main/apis/Media-Service-main
source .venv/bin/activate
python manage.py migrate
python manage.py runserver 8006
```

### NotificationService (puerto 8007)
```bash
cd PROYECTO-fullsatck-3-main/apis/NotificacionesServices-main
source .venv/bin/activate
python manage.py migrate
python manage.py runserver 8007
```

---

## BFF Express (puerto 5000)
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main/backend
npm install   # solo la primera vez
npm start
```

Modo desarrollo con auto-reload:
```bash
npm run dev
```

---

## Frontend Vite (puerto 5173)
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main
npm install   # solo la primera vez
npm run dev
```

---

## Primera vez: crear venvs

Si los venvs aun no existen, crealos con `uv` (preferido) o `python -m venv`:

```bash
cd PROYECTO-fullsatck-3-main/apis/<servicio>

# Opcion A: uv (rapido)
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Opcion B: pip standard
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Verificar tests por servicio

```bash
# Microservicios Django:
cd <servicio>
source .venv/bin/activate
pytest --cov --cov-report=html
open htmlcov/index.html

# BFF Node:
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main/backend
npm run test:coverage
open coverage/index.html

# Frontend React:
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main
npm run test:coverage
open coverage/index.html
```

---

## Mapa de puertos rapido

| Servicio | Puerto | Tipo |
|---|---:|---|
| Frontend | 5173 | HTTP (Vite) |
| BFF | 5000 | HTTP (Express) |
| AuthService | 8001 | HTTP (Django) |
| UserService | 8002 | HTTP (Django) |
| GeoService | 8003 | HTTP (Django) |
| ChatService | 8004 | HTTP + WS (Daphne) |
| MatchService | 8005 | HTTP (Django) |
| MediaService | 8006 | HTTP (Django) |
| NotificationService | 8007 | HTTP (Django) |
