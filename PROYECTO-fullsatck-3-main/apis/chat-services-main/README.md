# ChatService

Microservicio de **chat en tiempo real via WebSocket** usando Django Channels.

## Stack
- Django 5 + Django REST Framework
- **Django Channels** + Daphne (ASGI)
- In-memory channel layer (dev) / Redis (prod)
- SQLite (dev) / PostgreSQL (prod)

## Puerto
- **8004** (HTTP + WS)

## Endpoints principales

### REST
| Metodo | Path | Proposito |
|---|---|---|
| GET | `/api/rooms/` | Lista salas activas |
| GET | `/api/rooms/{room_name}/messages/` | Historial de mensajes |

### WebSocket
- `ws://localhost:8004/ws/chat/<room_name>/`
- Mensaje al consumer: `{"message": "<texto>", "sender": "<user_id>"}`
- Broadcast a todos los conectados a la sala.

## Modelo
- `Message`: `room_name` (indexed), `sender`, `content`, `timestamp` (auto_now_add).

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8004 chat_service_proj.asgi:application
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 94.6% / 15 tests pasados** (incluye tests WebSocket con `WebsocketCommunicator` + `ChannelsLiveServerTestCase`).

Reporte HTML en `./htmlcov/index.html`.

## Notas de seguridad
- El consumer actual no valida autenticacion en el handshake WS. En produccion **debe** integrarse con `channels.auth.AuthMiddlewareStack` para validar el JWT del usuario.
