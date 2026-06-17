# 🔌 Guía de Integración de Microservicios - Entrega 3

## 📋 Estado de Conexiones

### ✅ BFF (Backend for Frontend)
- **Puerto**: `5000`
- **Archivo de configuración**: `.env`
- **Status**: ✅ Configurado y listo

### ✅ Chat Service
- **Puerto**: `8004` (WebSocket)
- **URL**: `ws://localhost:8004`
- **Endpoints REST**:
  - `GET  /api/chat/health/` - Health check
  - `GET  /api/chat/config/` - Obtener configuración WebSocket
  - `GET  /api/chat/room/{room_name}/validate/` - Validar acceso a sala

### ✅ Match Service
- **Puerto**: `8005`
- **URL**: `http://localhost:8005`
- **Endpoints**:
  - `POST /api/match/analyze/` - Analizar imagen con IA (Gemini)
- **Requisitos**: `google-genai`

### ✅ Media Service
- **Puerto**: `8006`
- **URL**: `http://localhost:8006`
- **Endpoints**:
  - `POST /api/media/upload/` - Cargar imagen de mascota

### ✅ Notifications Service
- **Puerto**: `8007`
- **URL**: `http://localhost:8007`
- **Endpoints**:
  - `POST /api/notifications/trigger-match/` - Enviar notificación de match

---

## 🚀 Cómo Usar los Servicios en el Frontend

### 1️⃣ Usar los Service Clients Directamente

#### Chat Service
```javascript
import { chatServiceClient } from '@/services/api';

// Obtener configuración
const config = await chatServiceClient.getChatConfig();
console.log('WebSocket URL:', config.wsUrl);

// Validar acceso a sala
const validation = await chatServiceClient.validateRoomAccess('my-room');

// Conectar con WebSocket
const ws = chatServiceClient.connectToRoom('my-room');
```

#### Match Service
```javascript
import { matchServiceClient } from '@/services/api';

// Analizar imagen
const formData = new FormData();
formData.append('report_id', 'rep_123');
formData.append('pet_type', 'perro');
formData.append('image', imageFile);

const result = await matchServiceClient.analyzePetImage(formData);
// O usar helper:
const result = await matchServiceClient.analyzeWithImage(
  'rep_123', 
  'perro', 
  imageFile
);
```

#### Media Service
```javascript
import { mediaServiceClient } from '@/services/api';

// Cargar imagen
const formData = new FormData();
formData.append('image', imageFile);

const result = await mediaServiceClient.uploadImage(formData);
// O usar helper:
const result = await mediaServiceClient.uploadPetImage(imageFile, 'Foto de Rex');
```

#### Notifications Service
```javascript
import { notificationsServiceClient } from '@/services/api';

// Enviar notificación de match
const result = await notificationsServiceClient.triggerMatchNotification({
  userId: 123,
  userEmail: 'user@example.com',
  matchId: 456,
  petName: 'Rex'
});
```

---

### 2️⃣ Usar los Custom Hooks (Recomendado)

Los hooks manejan automáticamente loading, error y validaciones.

#### useChat Hook
```javascript
import { useChat } from '@/hooks';

function ChatRoom() {
  const { isConnected, messages, error, sendMessage } = useChat('my-room');

  const handleSendMessage = () => {
    sendMessage('Hola a todos');
  };

  return (
    <div>
      {isConnected ? '✅ Conectado' : '❌ Desconectado'}
      {error && <div className="error">{error}</div>}
      {messages.map((msg, i) => (
        <div key={i}>{msg.text}</div>
      ))}
      <button onClick={handleSendMessage}>Enviar</button>
    </div>
  );
}
```

#### useMatchAnalysis Hook
```javascript
import { useMatchAnalysis } from '@/hooks';

function AnalyzeImage() {
  const { analyzeImage, loading, result, error } = useMatchAnalysis();

  const handleAnalyze = async (file) => {
    try {
      const data = await analyzeImage('rep_123', 'perro', file);
      console.log('Descripción IA:', data.descripcion_automatica);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {loading && <span>Analizando...</span>}
      {result && <p>{result.descripcion_automatica}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

#### useMediaUpload Hook
```javascript
import { useMediaUpload } from '@/hooks';

function UploadImage() {
  const { uploadImage, loading, uploadedImage, error, progress } = useMediaUpload();

  const handleUpload = async (file) => {
    try {
      const data = await uploadImage(file, 'Foto de mascota');
      console.log('Imagen URL:', data.image_url);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {loading && <p>Progreso: {progress}%</p>}
      {uploadedImage && <img src={uploadedImage.image_url} />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

#### useNotifications Hook
```javascript
import { useNotifications } from '@/hooks';

function SendMatchNotification() {
  const { sendNotification, loading, error } = useNotifications();

  const handleNotify = async () => {
    try {
      await sendNotification(123, 'user@example.com', 456, 'Rex');
      console.log('Notificación enviada');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleNotify} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Notificación'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## 🔐 Configuración de Variables de Entorno

### Frontend (.env.local)
```
VITE_BFF_URL=http://localhost:5000
VITE_CHAT_SERVICE_URL=http://localhost:5000/api/chat
VITE_MATCH_SERVICE_URL=http://localhost:5000/api/match
VITE_MEDIA_SERVICE_URL=http://localhost:5000/api/media
VITE_NOTIFICATION_SERVICE_URL=http://localhost:5000/api/notifications
```

### BFF Backend (.env)
```
PORT=5000
CHAT_SERVICE_URL=ws://localhost:8004
MATCH_SERVICE_URL=http://localhost:8005
MEDIA_SERVICE_URL=http://localhost:8006
NOTIFICATION_SERVICE_URL=http://localhost:8007
```

---

## 🧪 Testing de Microservicios

### 1. Verificar Health Checks
```bash
# Chat Service
curl http://localhost:5000/api/chat/health/

# Match Service (a través del BFF)
curl -X POST http://localhost:5000/api/match/analyze/

# Media Service (a través del BFF)
curl -X POST http://localhost:5000/api/media/upload/

# Notifications Service (a través del BFF)
curl -X POST http://localhost:5000/api/notifications/trigger-match/
```

### 2. Probar Chat Config
```bash
curl http://localhost:5000/api/chat/config/
```

Respuesta esperada:
```json
{
  "success": true,
  "wsUrl": "ws://localhost:8004",
  "message": "Configuración de chat obtenida exitosamente",
  "endpoints": {
    "ws_connection": "ws://localhost:8004/ws/chat/",
    "room_format": "ws://localhost:8004/ws/chat/{room_name}/"
  }
}
```

### 3. Probar Upload de Imagen (con cURL)
```bash
curl -X POST \
  -F "image=@/path/to/image.jpg" \
  http://localhost:5000/api/media/upload/
```

---

## 🐛 Troubleshooting

### Error: "Error conectando con Match Service"
- Verificar que Match Service está corriendo en puerto 8005
- Verificar que MATCH_SERVICE_URL en .env es correcto
- Revisar logs del Match Service

### Error: "Connection refused en WebSocket"
- Verificar que Chat Service está corriendo en puerto 8004
- Revisar que CHAT_SERVICE_URL usa `ws://` y no `http://`
- Verificar ASGI en Chat Service está configurado correctamente

### Error: "Notificación no enviada"
- Verificar credenciales de email en Notifications Service
- Verificar que user_email tiene formato válido
- Revisar logs del Notifications Service

---

## 📚 Arquitectura de Comunicación

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                   (Puerto 5173/3000)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP/WebSocket
                       ▼
┌──────────────────────────────────────────────────────────┐
│        BFF (Node.js Express) - Puerto 5000              │
├──────────────────────────────────────────────────────────┤
│  ├─ /api/chat           ──┐                             │
│  ├─ /api/match          ──┤                             │
│  ├─ /api/media          ──┼──► HTTP Proxy              │
│  ├─ /api/notifications  ──┤                             │
│  └─ /api/auth, /api/pets ─┘                             │
└──────────────────┬───────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
        ▼          ▼          ▼          ▼
    Chat         Match      Media      Notifications
   8004         8005       8006         8007
  (Django)     (Django)    (Django)     (Django)
  WebSocket     REST        REST         REST
```

---

## ✨ Próximos Pasos

1. **Probar cada microservicio** independientemente
2. **Verificar conectividad** entre BFF y microservicios
3. **Implementar UI components** que usen los hooks
4. **Agregar autenticación** a nivel de microservicios
5. **Configurar CORS** adecuadamente en producción
6. **Agregar logging centralizado** para monitoreo

---

## 📞 Contacto y Soporte

Para problemas o preguntas sobre la integración, revisa:
- Los logs en la consola del navegador (DevTools)
- Los logs en la terminal de cada microservicio
- Verifica que todos los servicios están corriendo en los puertos correctos
