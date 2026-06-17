# 🌍 Geo Service - Microservicio de Geolocalización

## 📋 Descripción

**Geo Service** es un microservicio independiente responsable de:
- Almacenar ubicaciones geográficas de reportes de mascotas
- Buscar reportes cercanos a una ubicación específica
- Gestionar zonas geográficas
- Calcular distancias entre puntos
- Proporcionar estadísticas geográficas

## 🚀 Características

✅ **API REST completamente funcional**
- CRUD de ubicaciones
- Búsqueda de proximidad
- Estadísticas geográficas
- Gestión de zonas

✅ **Cálculo de distancias**
- Algoritmo de Haversine para distancias precisas
- Búsqueda en radio configurable

✅ **Independencia**
- Base de datos propia (SQLite o PostgreSQL)
- API independiente
- Sin dependencias de otros servicios

✅ **Tests incluidos**
- Tests unitarios de modelos
- Tests de API
- Pruebas de búsqueda de proximidad

## 📁 Estructura

```
geo_service/
├── manage.py                    # Django management
├── requirements.txt             # Dependencias
├── .env.example                 # Variables de entorno
├── README.md                    # Este archivo
│
├── geo_service/                 # Configuración
│   ├── settings.py              # Settings Django
│   ├── urls.py                  # Routing
│   ├── wsgi.py                  # WSGI
│   └── asgi.py                  # ASGI
│
└── geo_app/                     # Aplicación
    ├── models.py                # Location, GeoZone, GeoCache
    ├── serializers.py           # Serializers DRF
    ├── views.py                 # ViewSets y lógica
    ├── admin.py                 # Admin customizada
    ├── apps.py                  # Configuración app
    ├── tests.py                 # Tests
    ├── utils.py                 # Utilidades
    └── migrations/              # Migraciones
```

## ⚙️ Instalación y Setup

### 1. Setup de Python

```bash
cd microservicios/geo_service
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tu configuración
```

### 4. Migraciones de base de datos

```bash
python manage.py migrate
```

### 5. Crear superusuario (opcional)

```bash
python manage.py createsuperuser
```

### 6. Ejecutar servidor

```bash
python manage.py runserver 8001
```

El servicio estará disponible en: **http://localhost:8001/api/v1/**

## 📡 API Endpoints

### Locations

#### Listar todas las ubicaciones
```
GET /api/v1/locations/
```

**Response:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "reporte_id": "REP001",
      "pet_id": "PET001",
      "titulo": "Perrito Perdido en Bogotá",
      "latitud": 4.7110,
      "longitud": -74.0721,
      "tipo_reporte": "perdido",
      "tipo_animal": "Perro",
      "raza_probable": "Labrador",
      "color": "Negro",
      "fecha_reporte": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Crear una nueva ubicación
```
POST /api/v1/locations/
```

**Request:**
```json
{
  "reporte_id": "REP003",
  "pet_id": "PET003",
  "titulo": "Gato Encontrado",
  "latitud": 4.6500,
  "longitud": -74.0800,
  "tipo_reporte": "encontrado",
  "tipo_animal": "Gato",
  "raza_probable": "Siamés",
  "color": "Blanco"
}
```

#### Obtener una ubicación específica
```
GET /api/v1/locations/{id}/
```

#### Actualizar ubicación
```
PUT /api/v1/locations/{id}/
PATCH /api/v1/locations/{id}/
```

#### Eliminar ubicación
```
DELETE /api/v1/locations/{id}/
```

### Búsqueda de Proximidad

#### Buscar reportes cercanos
```
POST /api/v1/locations/buscar_cercanos/
```

**Request:**
```json
{
  "latitud": 4.7110,
  "longitud": -74.0721,
  "radio_km": 10,
  "tipo_reporte": "ambos",
  "limite": 50
}
```

**Response:**
```json
{
  "punto_busqueda": {
    "latitud": 4.7110,
    "longitud": -74.0721
  },
  "radio_km": 10,
  "tipo_reporte": "ambos",
  "total_encontrados": 5,
  "reportes": [
    {
      "id": 1,
      "titulo": "Perrito Perdido",
      "latitud": 4.7100,
      "longitud": -74.0720,
      "distancia_km": 0.16,
      ...
    }
  ]
}
```

#### Obtener reportes cercanos a un reporte específico
```
GET /api/v1/locations/{id}/obtener_cercanos/?radio=20
```

#### Estadísticas geográficas
```
POST /api/v1/locations/stats_geografico/
```

**Response:**
```json
{
  "total_reportes": 15,
  "perdidos": 8,
  "encontrados": 7,
  "tipo_animal_mas_reportado": {
    "tipo_animal": "Perro",
    "cantidad": 10
  }
}
```

### Zonas Geográficas

#### Listar zonas
```
GET /api/v1/locations/
```

#### Crear zona
```
POST /api/v1/geozone/
```

**Request:**
```json
{
  "nombre": "Centro Bogotá",
  "latitud_centro": 4.7110,
  "longitud_centro": -74.0721,
  "radio_km": 5,
  "zona_tipo": "barrio"
}
```

#### Reportes en una zona
```
GET /api/v1/geozone/{id}/reportes_en_zona/
```

##  Testing

Ejecutar tests con cobertura (Parcial 3):
```bash
pytest --cov --cov-report=html
```
**Cobertura actual: 87.1% / 56 tests pasados** (25 originales + 31 nuevos en `geo_app/tests/test_extra_coverage.py`).

Reporte HTML en `./htmlcov/index.html`. Cubre:
- `LocationViewSet` (list, buscar_cercanos, obtener_cercanos, stats_geografico, create).
- `calcular_distancia` (haversine).
- `UserServiceClient` + `PetServiceClient` (con mock de `safe_request` y Circuit Breaker).

Legacy:
```bash
python manage.py test geo_app.tests
```

## 📊 Modelos de Datos

### Location
- **reporte_id**: ID único del reporte
- **pet_id**: ID de la mascota
- **usuario_id**: ID del usuario que creó
- **latitud/longitud**: Coordenadas WGS84
- **tipo_reporte**: 'perdido' o 'encontrado'
- **tipo_animal**: Especie (perro, gato, etc)
- **raza_probable**: Raza estimada
- **color**: Color del animal
- **tamaño**: Tamaño (pequeño, mediano, grande)
- **fecha_reporte**: Cuándo se creó

### GeoZone
- **nombre**: Nombre único de la zona
- **latitud_centro/longitud_centro**: Centro della zona
- **radio_km**: Radio de búsqueda
- **zona_tipo**: Tipo (barrio, ciudad, región)
- **activa**: Si está activa

### GeoCache
- **latitud/longitud/radio_km**: Clave de caché
- **reportes_cercanos**: Datos en JSON
- **valido**: Si el caché sigue válido

## 🔌 Integración con otros Servicios

### Desde Pet Service
Cuando se crea un nuevo reporte, envía:
```json
POST http://localhost:8001/api/v1/locations/
{
  "reporte_id": "REP123",
  "pet_id": "PET456",
  "latitud": 4.7110,
  "longitud": -74.0721,
  "tipo_reporte": "perdido",
  ...
}
```

### Desde Match Service
Para encontrar coincidencias cercanas:
```bash
POST http://localhost:8001/api/v1/locations/buscar_cercanos/
{
  "latitud": 4.7110,
  "longitud": -74.0721,
  "radio_km": 20,
  "tipo_reporte": "encontrado"
}
```

## 🔐 Seguridad

- **CORS habilitado** para desarrollo
- **Permisos AllowAny** (cambiar en producción)
- **Validación de coordenadas WGS84**
- **Rate limiting** recomendado en API Gateway

## 📈 Performance

- **Índices en BD**: reporte_id, pet_id, tipo_reporte
- **Cálculo de distancias**: Algoritmo de Haversine (O(1) por reporte)
- **Caché recomendada**: Para búsquedas frecuentes

## 🐳 Docker (Próximamente)

```bash
docker build -t geo-service .
docker run -p 8001:8000 geo-service
```

## 📝 Próximos Pasos

1. ✅ **Geo Service** - COMPLETADO
2. ⏳ **Auth Service** - Autenticación
3. ⏳ **Pet Service** - Mascotas y reportes
4. ⏳ **Match Service** - Coincidencias
5. ⏳ **Chat Service** - Comunicación
6. ⏳ **Notification Service** - Notificaciones
7. ⏳ **API Gateway** - Enrutamiento central

## 📞 Soporte

Para problemas o preguntas, referirse a la documentación del proyecto principal.

---

**Geo Service v1.0.0** - Microservicio de Geolocalización para Sanos y Salvos
