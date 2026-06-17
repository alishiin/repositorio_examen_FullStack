# 🔧 SOLUCIÓN - Error 400 CSRF en Django

## 📌 Problema Identificado
El error `400 Bad Request` con mensaje `Bad request syntax ('6a')` fue causado por:
- Django rechazando requests POST sin token CSRF
- Falta de configuración de CORS en middleware
- Falta de CSRF_TRUSTED_ORIGINS

## ✅ Soluciones Aplicadas

### 1️⃣ **Match Service** (Puerto 8005)
✅ Actualizado: `settings.py`
- Agregados: `CORS_ALLOWED_ORIGINS`
- Agregados: `CSRF_TRUSTED_ORIGINS`

✅ Actualizado: `match_app/views.py`
- Agregado: `@csrf_exempt` decorator
- Importadas: `csrf_exempt` y `method_decorator`

### 2️⃣ **Media Service** (Puerto 8006)
✅ Actualizado: `settings.py`
- Agregados: `CORS_ALLOWED_ORIGINS`
- Agregados: `CSRF_TRUSTED_ORIGINS`
- Movido: `corsheaders` al inicio del MIDDLEWARE

✅ Actualizado: `media_app/views.py`
- Agregado: `@csrf_exempt` decorator

### 3️⃣ **Notification Service** (Puerto 8007)
✅ Actualizado: `settings.py`
- Agregados: `CORS_ALLOWED_ORIGINS`
- Agregados: `CSRF_TRUSTED_ORIGINS`
- Agregado: `corsheaders` en MIDDLEWARE

✅ Actualizado: `notification_app/views.py`
- Agregado: `@csrf_exempt` decorator

### 4️⃣ **Chat Service** (Puerto 8004)
✅ Actualizado: `settings.py`
- Agregados: `CORS_ALLOWED_ORIGINS`
- Agregados: `CSRF_TRUSTED_ORIGINS`
- Movido: `corsheaders` al inicio del MIDDLEWARE

---

## 🚀 Instrucciones de Restart

### ⚠️ IMPORTANTE: Reinicia todos los servicios Django

```bash
# Termina los servidores anteriores (Ctrl+C en cada terminal)

# Terminal 1 - Chat Service (8004)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\chat-services-main"
python manage.py runserver 8004

# Terminal 2 - Match Service (8005)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\MatchService-main"
python manage.py runserver 8005

# Terminal 3 - Media Service (8006)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\Media-Service-main"
python manage.py runserver 8006

# Terminal 4 - Notification Service (8007)
cd "C:\Users\sekai\Downloads\PRUEBA 3 FULLSTACK\MICROSERVICIOS ENTREGA 3\NotificacionesServices-main"
python manage.py runserver 8007
```

---

## ✅ Verificación

Una vez reiniciados todos los servicios, prueba en Postman:

### Test 1: Match Service
```
POST http://localhost:5000/api/match/analyze

Body (form-data):
- report_id: "test_001"
- pet_type: "perro"
- image: [Selecciona archivo]

Respuesta esperada: 201 Created
```

### Test 2: Media Service
```
POST http://localhost:5000/api/media/upload

Body (form-data):
- image: [Selecciona archivo]

Respuesta esperada: 201 Created
```

### Test 3: Notification Service
```
POST http://localhost:5000/api/notifications/trigger-match

Headers: Content-Type: application/json

Body (raw JSON):
{
  "user_id": "test_user",
  "user_email": "test@example.com",
  "match_id": "match_001",
  "pet_name": "Max"
}

Respuesta esperada: 200 OK
```

---

## 🔍 Checklist de Verificación

- [ ] Todos los servicios Django reiniciados
- [ ] BFF ejecutándose en puerto 5000
- [ ] POST /api/match/analyze retorna 201 (no 400)
- [ ] POST /api/media/upload retorna 201 (no 400)
- [ ] POST /api/notifications/trigger-match retorna 200 (no 400)
- [ ] GET /api/chat/config retorna 200 con wsUrl

---

## 📝 Cambios Específicos en Código

### Match Service - views.py
```python
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class AnalyzePetImageView(APIView):
    def post(self, request):
        # ... resto del código
```

### Match Service - settings.py
```python
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]
```

---

## 🚨 Si Aún Hay Errores

### Error: "Connection refused"
- Verifica que todos los servicios estén ejecutándose
- Revisa los puertos: 8004, 8005, 8006, 8007

### Error: "400 Bad Request" persiste
- Limpia la caché del navegador
- Reinicia los servicios Django completamente
- Verifica que el BFF esté usando la variable de entorno correcta

### Error: "CORS error"
- Verifica que `corsheaders` esté en el middleware ANTES que otros middlewares
- Verifica que `CORS_ALLOW_ALL_ORIGINS = True` esté en settings.py

---

## 📚 Referencias

Ver archivo completo de testing: `TESTING_MICROSERVICIOS.md`
