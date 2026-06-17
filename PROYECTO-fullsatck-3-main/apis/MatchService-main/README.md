# MatchService

Microservicio de **analisis de imagenes con IA (Google Gemini)** para encontrar coincidencias entre reportes de mascotas perdidas y encontradas.

## Stack
- Django 5 + Django REST Framework
- `google-genai` (SDK oficial de Gemini)
- SQLite (dev) / PostgreSQL (prod)

## Puerto
- **8005**

## Endpoints principales

| Metodo | Path | Proposito |
|---|---|---|
| POST | `/api/match/analyze/` | Analiza imagen de mascota con Gemini, genera descripcion |
| GET | `/api/match/results/` | Lista coincidencias detectadas |

## Modelos
- `PetAnalysis`: resultado del analisis IA (reporte_id, descripcion automatica, score).
- `MatchResult`: coincidencias detectadas entre reportes (report_a, report_b, similarity_score).

## Variables de entorno
```bash
export GEMINI_API_KEY="<tu-api-key-de-Google-AI-Studio>"
```

> **NOTA DE SEGURIDAD**: revisar que la key NO este hardcodeada en `gemini_service.py`. Si lo esta, **rotarla en Google AI Studio** y moverla a `.env`.

## Como levantar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8005
```

## Tests
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 100% / 19 tests pasados** (Gemini mockeado con `unittest.mock`).

Reporte HTML en `./htmlcov/index.html`.
