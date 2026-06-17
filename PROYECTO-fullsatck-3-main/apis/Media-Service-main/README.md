# MediaService

Microservicio para subida y servicio de imagenes de mascotas.

## Stack
- Django 5 + Django REST Framework
- Pillow (procesamiento de imagenes)
- Almacenamiento local (`media/pets_uploaded/`) en dev, S3 planificado para prod

## Puerto
- **8006**

## Endpoints principales

| Metodo | Path | Proposito |
|---|---|---|
| POST | `/api/upload/` | Sube una imagen (multipart) - devuelve URL publica |
| GET | `/api/images/` | Lista las imagenes subidas |
| GET | `/media/pets_uploaded/<filename>` | Sirve la imagen estaticamente |

## Modelo
- `PetImage`: UUID primary key, ImageField, pet_id, description, mime_type, size_bytes, uploaded_at.

## Validaciones
- Tipo MIME debe ser `image/*`.
- Tamano maximo: 10MB.

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8006
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 97.6% / 16 tests pasados.**

Reporte HTML en `./htmlcov/index.html`.
