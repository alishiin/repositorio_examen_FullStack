# 🚀 Guía Rápida de Inicio - Microservicios Entrega 3

## 📦 Instalación y Configuración

### 1. Clonar repositorios (si no está hecho)
```bash
cd c:\Users\stago\Desktop\FULLSTACKPRUEBA3-main\FULLSTACKPRUEBA3-main
```

### 2. Iniciar BFF (Backend for Frontend)
```bash
cd PROYECTO-fullsatck-3-main\frontend_sanos_y_salvos-main\backend
npm install  # Si no está instalado
npm start    # Inicia en puerto 5000
```

---

## 🔌 Iniciar Microservicios (En orden de dependencia)

### 3. Chat Service
```bash
cd MICROSERVICIOS\ ENTREGA\ 3\chat-services-main
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8004
```

### 4. Match Service (Requiere Google Gemini API Key)
```bash
cd MICROSERVICIOS\ ENTREGA\ 3\MatchService-main

# Configurar API key de Google Gemini en .env
# GOOGLE_GENAI_API_KEY=tu_api_key_aqui

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8005
```

### 5. Media Service
```bash
cd MICROSERVICIOS\ ENTREGA\ 3\Media-Service-main
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8006
```

### 6. Notifications Service (Opcional: Requiere credenciales de email)
```bash
cd MICROSERVICIOS\ ENTREGA\ 3\NotificacionesServices-main

# Configurar credenciales de email en .env
# EMAIL_HOST_USER=tu-email@gmail.com
# EMAIL_HOST_PASSWORD=tu-app-password

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8007
```

### 7. Frontend (React + Vite)
```bash
cd PROYECTO-fullsatck-3-main\frontend_sanos_y_salvos-main
npm install  # Si no está instalado
npm run dev  # Inicia en puerto 5173
```

---

## ✅ Verificar que Todo Está Funcionando

### Health Checks
```bash
# BFF Health
curl http://localhost:5000/api/health

# Chat Config
curl http://localhost:5000/api/chat/health/

# Match Service
curl http://localhost:5000/api/match/analyze/

# Media Service  
curl http://localhost:5000/api/media/upload/

# Notifications Service
curl http://localhost:5000/api/notifications/trigger-match/
```

### Puertos a Verificar
- ✅ BFF: `http://localhost:5000`
- ✅ Chat: `ws://localhost:8004`
- ✅ Match: `http://localhost:8005`
- ✅ Media: `http://localhost:8006`
- ✅ Notifications: `http://localhost:8007`
- ✅ Frontend: `http://localhost:5173`

---

## 🔧 Variables de Entorno Críticas

### Google Gemini API Key (Match Service)
1. Ir a: https://aistudio.google.com/app/apikeys
2. Crear nueva API key
3. Copiar en `.env` de Match Service

### Email (Notifications Service - Opcional)
1. Usar Gmail con "Contraseña de aplicación"
2. Habilitar "Acceso de aplicaciones menos seguras"
3. Configurar en `.env` de Notifications Service

---

## 📊 Estructura de Carpetas Configurada

```
.
├── BFF (Puerto 5000)
│   ├── /api/chat           → Chat Service
│   ├── /api/match          → Match Service  
│   ├── /api/media          → Media Service
│   ├── /api/notifications  → Notifications Service
│   └── [Otros endpoints]
│
├── Chat Service (Puerto 8004 - WebSocket)
│   ├── /api/chat/health
│   ├── /api/chat/config
│   └── /api/chat/room/{name}/validate
│
├── Match Service (Puerto 8005)
│   └── /api/match/analyze  (POST)
│
├── Media Service (Puerto 8006)
│   └── /api/media/upload   (POST)
│
├── Notifications Service (Puerto 8007)
│   └── /api/notifications/trigger-match  (POST)
│
└── Frontend (Puerto 5173)
    └── React + Vite
```

---

## 🐛 Troubleshooting

### "Connection Refused" Error
```
Solución: Verificar que el servicio está corriendo en el puerto indicado
- Abrir nueva terminal y revisar logs
- Verificar puerto disponible con: netstat -ano | findstr :8004
```

### "CORS Error"
```
Solución: Verificar CORS_ALLOWED_ORIGINS en .env de cada servicio
- Debe incluir http://localhost:5000
- Debe incluir http://localhost:5173
```

### "Google Gemini Error"
```
Solución: Verificar Google API Key
1. curl http://localhost:8005/api/match/health para verificar servicio
2. Revisar logs del Match Service
3. Validar que GOOGLE_GENAI_API_KEY está en .env
```

### "WebSocket Connection Error"
```
Solución: Verificar Chat Service
1. curl http://localhost:5000/api/chat/health
2. Revisar que wsUrl es: ws://localhost:8004
3. No usar http:// para WebSocket, usar ws://
```

---

## 📱 Pruebas desde Frontend

### Ejemplo: Analizar Imagen de Mascota
```javascript
import { useMatchAnalysis } from '@/hooks';

function TestMatch() {
  const { analyzeImage, loading, result } = useMatchAnalysis();

  const handleTest = async () => {
    const file = document.getElementById('fileInput').files[0];
    try {
      const result = await analyzeImage('test_123', 'perro', file);
      console.log('Resultado:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <input type="file" id="fileInput" />
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Analizando...' : 'Analizar'}
      </button>
      {result && <p>{result.descripcion_automatica}</p>}
    </div>
  );
}
```

---

## 📝 Notas Importantes

1. **Orden de Inicio**: Iniciar BFF antes de cualquier cliente
2. **API Keys**: No commitar .env a git (usar .env.example)
3. **CORS**: En producción, cambiar CORS_ALLOWED_ORIGINS a dominio real
4. **Database**: Ejecutar `python manage.py migrate` en cada servicio
5. **Logs**: Revisar logs en consola de cada servicio para debug

---

## 🔗 Enlaces Útiles

- [Google Gemini API](https://aistudio.google.com)
- [Django Documentation](https://docs.djangoproject.com)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Express.js](https://expressjs.com)
- [WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✨ Siguientes Pasos

1. ✅ Configuración completada
2. ⬜ Agregar autenticación JWT
3. ⬜ Implementar caché (Redis)
4. ⬜ Agregar rate limiting
5. ⬜ Configurar logging centralizado
6. ⬜ Escribir tests unitarios
7. ⬜ Deploy a producción
