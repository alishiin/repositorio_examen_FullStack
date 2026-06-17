# Estrategia de Persistencia - Sanos y Salvos

## Vision General
Cada microservicio gestiona su propia base de datos (**Database-per-service**). En desarrollo se usa **SQLite** (zero-config) y en produccion **PostgreSQL + PostGIS** para GeoService.

| Servicio | DB dev | DB prod | Extensiones |
|---|---|---|---|
| AuthService | SQLite | PostgreSQL | - |
| UserService | SQLite | PostgreSQL | - |
| GeoService | SQLite | PostgreSQL | **PostGIS** (consultas espaciales) |
| ChatService | SQLite | PostgreSQL | - |
| MatchService | SQLite | PostgreSQL | - |
| MediaService | SQLite + FileSystem | PostgreSQL + S3 | - |
| NotificationService | SQLite | PostgreSQL | - |

## ORM: Django ORM
Se usa Django ORM en **todos** los microservicios. Justificacion:
- **Productividad**: migraciones automaticas (`makemigrations` + `migrate`).
- **Validaciones a nivel modelo**: clean(), validators, choices.
- **Consultas tipo-seguras**: QuerySet chaining sin SQL injection.
- **Soporte multi-backend**: SQLite/PostgreSQL/MySQL sin cambiar codigo.
- **Admin auto-generado**: util para debugging en dev.

## Modelos por servicio

### AuthService (`auth_user_services/AuthService/`)
- Usa el `User` default de Django (`django.contrib.auth.User`).
- Tokens manejados por `rest_framework_simplejwt` (no requiere modelo extra: los tokens son JWT autocontenidos).
- **Migraciones**: solo las default de Django (`auth_*`, `contenttypes_*`, `sessions_*`).

### UserService (`auth_user_services/UserService/`)
- **`users.User`** (custom, hereda `AbstractUser`):
  - `email` (unique, indexed)
  - `full_name` (CharField)
  - `rut` (unique, validator chileno modulo 11)
  - `phone` (validator formato chileno)
  - `commune`, `address`
  - `password` (hashed con `make_password`)
- **Validators custom** en `users/validators.py`:
  - `validate_rut`: algoritmo modulo 11 con DV (probado con 29 casos parametrizados).
  - `validate_phone_cl`: formato +56 9 XXXX XXXX.
- **65 tests / 100% coverage**.

### GeoService (`apis/sanosysalvos-geoservice-main/`)
- **`Location`** (reportes geolocalizados):
  - `reporte_id`, `pet_id`, `usuario_id` (referencias cross-service, sin FK)
  - `latitud`, `longitud` (FloatField con validators -90..90, -180..180)
  - `titulo`, `descripcion`
  - `tipo_reporte` (choices: `perdido` / `encontrado`)
  - `tipo_animal`, `raza_probable`, `color`, `tamano`
  - **`imagen_url`** (URL desde MediaService) - agregado en migracion **`0003_location_imagen_url`**.
  - `fecha_reporte`, `fecha_actualizacion`
  - **Indices**: `(latitud, longitud)`, `reporte_id`, `tipo_reporte`, `usuario_id`
- **`GeoZone`** (zonas geograficas de busqueda):
  - `nombre`, `latitud_centro`, `longitud_centro`, `radio_km`, `zona_tipo`
- **`GeoCache`** (cache de consultas geograficas frecuentes):
  - `latitud`, `longitud`, `radio_km` como clave; `reportes_cercanos` como JSON.
- **56 tests / 87.1% coverage**.

### MatchService (`apis/MatchService-main/`)
- **`PetAnalysis`** (resultado del analisis IA Gemini):
  - `reporte_id` (referencia a Location)
  - `pet_type`, `image_url`, `descripcion_automatica` (output Gemini)
  - `confidence_score`, `analyzed_at`
- **`MatchResult`** (coincidencias detectadas):
  - `report_a_id`, `report_b_id`, `similarity_score`, `matched_at`
- **19 tests / 100% coverage** (Gemini mockeado).

### MediaService (`apis/Media-Service-main/`)
- **`PetImage`**:
  - `id` (UUID primary key)
  - `image` (ImageField - guarda en `media/pets_uploaded/`)
  - `pet_id`, `description`, `uploaded_at`, `mime_type`, `size_bytes`
- **Validaciones**: tipo de archivo (image/*), tamano maximo 10MB.
- **16 tests / 97.6% coverage**.

### NotificationService (`apis/NotificacionesServices-main/`)
- **`Notification`**:
  - `user_id` (referencia cross-service)
  - `match_id` (opcional)
  - `title`, `message`, `notification_type` (choices)
  - `status`, **`read`** (BooleanField - agregado en migracion **`0002_notification_read`**)
  - `created_at`, `sent_at`
- **30 tests / 99.1% coverage**.

### ChatService (`apis/chat-services-main/`)
- **`Message`** (persistencia de mensajes):
  - `room_name` (indexed)
  - `sender` (user_id)
  - `content` (TextField)
  - `timestamp` (auto_now_add)
- **15 tests / 94.6% coverage** (incluye tests WebSocket con `WebsocketCommunicator`).

## Migraciones recientes
- `geo_app.0003_location_imagen_url` - agrega URL de imagen al reporte (FASE 1A).
- `notification_app.0002_notification_read` - agrega flag `read` para notificaciones in-app (FASE 1B).

## Validators custom
- **RUT chileno** en `UserService` (`users/validators.py::validate_rut`):
  - Algoritmo modulo 11 con digito verificador.
  - Acepta formato `12.345.678-9` o `12345678-9` o `123456789`.
  - 29 tests parametrizados (12 validos + 17 invalidos).
- **Telefono chileno** en `UserService` (`users/validators.py::validate_phone_cl`):
  - Acepta `+56 9 XXXX XXXX`, `+569XXXXXXXX`, `9XXXXXXXX`.

## Procedimientos almacenados (Stored Procedures) y queries espaciales
- **Produccion (PostgreSQL + PostGIS)**: se planea reemplazar el haversine Python por:
  ```sql
  SELECT *, ST_Distance(geom, ST_MakePoint(:lng, :lat)::geography) AS dist_m
  FROM geo_app_location
  WHERE ST_DWithin(geom, ST_MakePoint(:lng, :lat)::geography, :radio_m)
  ORDER BY dist_m ASC;
  ```
- **Desarrollo (SQLite)**: el calculo se hace en Python con formula de Haversine (`geo_app/views.py::calcular_distancia`).
- **Particiones**: para tabla `Notification` en produccion se planea particionar por mes (`PARTITION BY RANGE (created_at)`).

## Comunicacion entre servicios (referencias cross-DB)
**NO hay foreign keys cross-service**. Cada servicio guarda IDs como `CharField` / `IntegerField` y se resuelven via HTTP cuando es necesario.

Justificacion (Microservices pattern):
- **Independencia**: cada DB puede evolucionar su esquema sin coordinar con las demas.
- **Despliegue independiente**: no hay deadlocks entre migraciones cross-service.
- **Escalabilidad**: se puede mover un servicio a otro motor sin tocar los demas.

Ejemplo: `Location.usuario_id` es un `IntegerField` que apunta a `users.User.id`. La resolucion al nombre/email del usuario se hace en el BFF (o en el cliente) llamando a `GET /api/users/{id}/` con `UserServiceClient` (que ademas pasa por **Circuit Breaker**).

## Backups y retencion
- **Dev**: `db.sqlite3` versionado solo si esta vacio; en `.gitignore` para evitar PII.
- **Prod (planificado)**:
  - Backups diarios con `pg_dump` rotacion 30 dias.
  - Retencion de mensajes de chat: 90 dias.
  - Retencion de notificaciones leidas: 60 dias.
  - Imagenes huerfanas (sin reporte asociado tras 7 dias): purga automatica.
