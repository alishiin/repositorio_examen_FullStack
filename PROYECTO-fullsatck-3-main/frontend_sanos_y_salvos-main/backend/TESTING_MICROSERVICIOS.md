# 📋 Guía de Testing - Microservicios Integrados

## 🚀 Arranque de Servicios (Orden Recomendado)

### 1️⃣ **Inicia los Microservicios Django** (En terminales separadas)

```bash
# Terminal 1 - Chat Service (Puerto 8004)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\chat-services-main"
python manage.py runserver 8004

# Terminal 2 - Match Service (Puerto 8005)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\MatchService-main"
python manage.py runserver 8005

# Terminal 3 - Media Service (Puerto 8006)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\Media-Service-main"
python manage.py runserver 8006

# Terminal 4 - Notification Service (Puerto 8007)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\NotificacionesServices-main"
python manage.py runserver 8007
```

### 2️⃣ **Inicia el BFF** (Backend for Frontend)

```bash
# Terminal 5 - BFF (Puerto 5000)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\PROYECTO-fullsatck-3-main\frontend_sanos_y_salvos-main\backend"
npm run dev
```

---

## 📊 Resumen de Puertos

| Servicio | Puerto | URL | Tipo |
|----------|--------|-----|------|
| GeoService | 8001 | http://localhost:8001 | HTTP |
| UserService | 8002 | http://localhost:8002 | HTTP |
| AuthService | 8003 | http://localhost:8003 | HTTP |
| **Chat Service** | **8004** | **ws://localhost:8004** | **WebSocket** |
| **Match Service** | **8005** | **http://localhost:8005** | **HTTP** |
| **Media Service** | **8006** | **http://localhost:8006** | **HTTP** |
| **Notification Service** | **8007** | **http://localhost:8007** | **HTTP** |
| BFF | 5000 | http://localhost:5000 | HTTP |

---

## 🧪 Testing en Postman

### ✅ Verificar que todo está funcionando

```
GET http://localhost:5000/api/health

Respuesta esperada:
{
  "status": "OK",
  "message": "BFF está funcionando correctamente"
}
```

---

### 🎯 **Test 1: Chat Service - Obtener Configuración WebSocket**

```
GET http://localhost:5000/api/chat/config

Respuesta esperada:
{
  "success": true,
  "wsUrl": "ws://localhost:8004",
  "message": "Configuración de chat obtenida exitosamente"
}
```

---

### 🎯 **Test 2: Chat Service - Validar Acceso a Sala**

```
GET http://localhost:5000/api/chat/room/sala_usuarios_123

Respuesta esperada:
{
  "success": true,
  "wsUrl": "ws://localhost:8004",
  "room": "sala_usuarios_123",
  "authorized": true,
  "wsEndpoint": "ws://localhost:8004/ws/chat/sala_usuarios_123/",
  "message": "Acceso a sala de chat autorizado"
}
```

---

### 🎯 **Test 3: Match Service - Analizar Imagen**

```
POST http://localhost:5000/api/match/analyze

Headers:
  (Sin Content-Type - Postman lo detecta automáticamente)

Body (form-data):
  report_id: "reporte_001"
  pet_type: "perro"
  image: [Seleccionar archivo .jpg/.png]

Respuesta esperada:
{
  "message": "Imagen analizada exitosamente por Gemini",
  "report_id": "reporte_001",
  "pet_type": "perro",
  "descripcion_automatica": "Descripción generada por IA..."
}
```

**📌 Pasos en Postman:**
1. Cambia a **Body** → **form-data**
2. Añade 3 campos:
   - `report_id` (text): `reporte_001`
   - `pet_type` (text): `perro`
   - `image` (file): Selecciona una imagen
3. Click en **Send**

---

### 🎯 **Test 4: Media Service - Subir Imagen**

```
POST http://localhost:5000/api/media/upload

Headers:
  (Sin Content-Type - Postman lo detecta automáticamente)

Body (form-data):
  image: [Seleccionar archivo .jpg/.png]
  pet_id: "mascota_123" (opcional)
  report_id: "reporte_001" (opcional)

Respuesta esperada:
{
  "id": 1,
  "image": "http://localhost:8006/media/pets_uploaded/imagen_123.jpg",
  "pet_id": "mascota_123",
  "report_id": "reporte_001",
  "created_at": "2026-06-16T10:30:00Z"
}
```

**📌 Pasos en Postman:**
1. Cambia a **Body** → **form-data**
2. Añade campos:
   - `image` (file): Selecciona una imagen
   - `pet_id` (text): `mascota_123`
   - `report_id` (text): `reporte_001`
3. Click en **Send**

---

### 🎯 **Test 5: Notification Service - Enviar Notificación**

```
POST http://localhost:5000/api/notifications/trigger-match

Headers:
  Content-Type: application/json

Body (raw - JSON):
{
  "user_id": "usuario_123",
  "user_email": "usuario@ejemplo.com",
  "match_id": "match_456",
  "pet_name": "Max"
}

Respuesta esperada:
{
  "message": "Notificación procesada con éxito"
}
```

**📌 Pasos en Postman:**
1. Cambia a **Body** → **raw** → **JSON**
2. Copia el JSON de arriba
3. Click en **Send**

---

## 🐛 Solución de Problemas

### Error: "Cannot POST /api/match/analyze"
- ✅ Verificar que el BFF está corriendo en puerto 5000
- ✅ Verificar que Match Service está corriendo en puerto 8005

### Error: "Connection refused" en Match Service
- ✅ Asegurarse de que Django está ejecutándose: `python manage.py runserver 8005`
- ✅ Verificar que está en la carpeta correcta

### Error: "No se proporcionó archivo de imagen"
- ✅ En Postman, cambiar a **form-data**
- ✅ Seleccionar un archivo real para el campo `image`

### Error de CORS
- ✅ Si aparece error de CORS, necesita añadir en `settings.py` de Django:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://localhost:3000",
]
```

---

## 📝 Checklist de Verificación

- [ ] **Puerto 8004** - Chat Service respondiendo
- [ ] **Puerto 8005** - Match Service respondiendo
- [ ] **Puerto 8006** - Media Service respondiendo
- [ ] **Puerto 8007** - Notification Service respondiendo
- [ ] **Puerto 5000** - BFF respondiendo en `/api/health`
- [ ] **GET /api/chat/config** - Retorna wsUrl correctamente
- [ ] **POST /api/match/analyze** - Acepta archivo de imagen
- [ ] **POST /api/media/upload** - Retorna URL de imagen
- [ ] **POST /api/notifications/trigger-match** - Envía notificación exitosamente

---

## 🔄 Workflow Completo (Ejemplo)

```
1. Usuario sube foto de mascota → POST /api/media/upload
2. Se obtiene URL de la imagen
3. Se envía a analizar → POST /api/match/analyze
4. Gemini genera descripción
5. Se guarda en BD y se envía notificación → POST /api/notifications/trigger-match
6. Usuario se conecta a chat → GET /api/chat/room/match_123
7. Usuarios intercambian mensajes por WebSocket
```

---

## 📚 Referencias Rápidas

**Variables de Entorno (.env):**
```env
CHAT_SERVICE_URL=ws://localhost:8004
MATCH_SERVICE_URL=http://localhost:8005
MEDIA_SERVICE_URL=http://localhost:8006
NOTIFICATION_SERVICE_URL=http://localhost:8007
```

**URLs del BFF:**
```
GET  http://localhost:5000/api/health
GET  http://localhost:5000/api/chat/config
GET  http://localhost:5000/api/chat/room/:roomName
POST http://localhost:5000/api/match/analyze
POST http://localhost:5000/api/media/upload
POST http://localhost:5000/api/notifications/trigger-match
```
