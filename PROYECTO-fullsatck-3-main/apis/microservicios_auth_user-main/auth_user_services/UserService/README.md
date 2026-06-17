# UserService

Servicio de gestion de usuarios (CRUD) con validadores chilenos (RUT, telefono).

## Stack
- Django 5 + Django REST Framework
- Custom `User` (hereda `AbstractUser`)
- SQLite (dev) / PostgreSQL (prod)

## Puerto
- **8002**

## Endpoints principales

| Metodo | Path | Proposito |
|---|---|---|
| POST | `/api/users/` | Crear usuario (registro publico) |
| GET | `/api/users/` | Listar usuarios (requiere auth) |
| GET | `/api/users/{id}/` | Detalle de usuario |
| PATCH | `/api/users/{id}/` | Actualizar campos |
| DELETE | `/api/users/{id}/` | Eliminar usuario |

## Modelos
- `users.User`: email (unique), full_name, **rut** (validator modulo 11), **phone** (formato chileno), commune, address, password (hashed).

## Validators custom
- `validate_rut` en `users/validators.py` (algoritmo modulo 11 chileno).
- `validate_phone_cl` (formato `+56 9 XXXX XXXX`).

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 100% / 65 tests pasados** (29 parametrizados para RUT, 12 para telefono).

Reporte HTML en `./htmlcov/index.html`.
