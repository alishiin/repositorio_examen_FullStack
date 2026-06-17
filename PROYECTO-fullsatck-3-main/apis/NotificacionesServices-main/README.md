# NotificationService

Microservicio de notificaciones in-app (avisos al usuario cuando hay un match, mensaje, etc.).

## Stack
- Django 5 + Django REST Framework
- SQLite (dev) / PostgreSQL (prod)

## Puerto
- **8007**

## Endpoints principales

| Metodo | Path | Proposito |
|---|---|---|
| GET | `/api/notifications/?user_id=X` | Lista notificaciones del usuario |
| POST | `/api/notifications/` | Crea una notificacion (interno) |
| POST | `/api/notifications/{id}/mark-read/` | Marca como leida |
| POST | `/api/notifications/trigger-match/` | Disparador externo (usado por MatchService o BFF) |

## Modelo
- `Notification`:
  - `user_id` (referencia cross-service)
  - `match_id` (opcional)
  - `title`, `message`, `notification_type`
  - `status`, **`read`** (BooleanField - migracion `0002_notification_read`)
  - `created_at`, `sent_at`

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8007
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 99.1% / 30 tests pasados.**

Reporte HTML en `./htmlcov/index.html`.
