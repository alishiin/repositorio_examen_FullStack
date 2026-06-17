# AuthService

Servicio de autenticacion con JWT (SimpleJWT) para la plataforma Sanos y Salvos.

## Stack
- Django 5 + Django REST Framework
- `djangorestframework-simplejwt` (JWT autocontenidos)
- SQLite (dev) / PostgreSQL (prod)

## Puerto
- **8001**

## Endpoints principales

| Metodo | Path | Proposito |
|---|---|---|
| POST | `/api/login/` | Login con email + password, devuelve `{access, refresh}` |
| POST | `/api/token/refresh/` | Refresca el token de acceso |
| POST | `/api/token/verify/` | Valida un token |

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 100% / 11 tests pasados.**

Reporte HTML en `./htmlcov/index.html`.
