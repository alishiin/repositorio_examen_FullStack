# Smoke Test E2E - Sanos y Salvos

Guion paso a paso para validar manualmente que todos los servicios funcionan end-to-end antes de la defensa.

## Pre-requisitos
- Python 3.11+ con `uv` instalado (`brew install uv` o `pip install uv`)
- Node.js 18+
- Mac/Linux (los scripts usan bash)
- Opcional: `GEMINI_API_KEY` configurada en `apis/MatchService-main/.env`. Si no esta, MatchService responde con un mensaje "Error de autenticacion con el servicio de IA" en lugar del analisis real (el flujo no se rompe).

---

## 1. Levantar todo

Desde la raiz del repo:

```bash
cd /Users/n0n04pw/Documents/Nicolas_Projects/repofullstackyyy3-main
./start-all.sh
```

- **Primera vez**: ~2-3 min (crea venvs e instala deps para 7 microservicios + BFF + frontend).
- **Siguientes**: ~10s.

El navegador se abre solo en http://localhost:5173.

---

## 2. Verificar salud (en otra terminal)

```bash
curl -s http://localhost:5000/api/health        # BFF
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/   # Frontend
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/admin/   # Auth
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8002/admin/   # User
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8003/admin/   # Geo
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8005/admin/   # Match
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8006/admin/   # Media
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8007/admin/   # Notification
```

Los `/admin/` Django devuelven `302` (redirect a login) cuando estan vivos. El BFF `/api/health` devuelve JSON.

---

## 3. Crear datos demo (opcional pero recomendado)

```bash
./entrega/05-demo/seed-demo.sh
```

Te deja:
- `admin@sanosysalvos.cl` / `admin123` (superuser)
- `demo@example.cl` / `demo1234` (usuario normal)

---

## 4. Flujo manual de prueba (Frontend)

### A. Registro / Login
- [ ] Abrir http://localhost:5173
- [ ] Click "Iniciar sesion" - click "Registrarse"
- [ ] Crear cuenta nueva (o usar `demo@example.cl` / `demo1234` si corriste el seed)
- [ ] Verificar que aparezca tu nombre en el Header

### B. Crear reporte CON foto
- [ ] Ir a "Reportar Mascota" (boton principal del Home)
- [ ] Completar: titulo, descripcion, tipo (perdido/encontrado), animal, color
- [ ] **Adjuntar una foto** (jpg/png cualquiera)
- [ ] Click "Publicar Reporte"
- [ ] Esperar mensaje "Reporte creado exitosamente"
- [ ] Si tienes Gemini key configurada: deberia aparecer un card "Analisis IA" con descripcion automatica

### C. Ver reporte en el Mapa
- [ ] Ir a "Mapa" en el nav
- [ ] El marker de tu reporte deberia estar visible
- [ ] Clickrker - popup debe mostrar la foto que subiste

### D. Notificaciones in-app

#### Generar una notificacion manual:
```bash
curl -X POST http://localhost:5000/api/notifications/trigger-match \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "user_email": "demo@example.cl", "match_id": 1, "pet_name": "Rex"}'
```

- [ ] Ver en el Header la campanita
- [ ] Badge rojo con numero deberia aparecer en max 30s (polling)
- [ ] Click - dropdown con lista
- [ ] Ir a "Mi Cuenta" - ver seccion "Mis Notificaciones"
- [ ] Click "Marcar como leida" - el badge baja

### E. Chat en tiempo real
- [ ] Click en "Chat" en el Header (solo si logueado)
- [ ] Aparecen 5 salas predefinidas (general, perros-perdidos, etc.)
- [ ] Click en cualquier sala - ventana de chat
- [ ] Header de la sala dice "Conectado" en verde
- [ ] Escribir mensaje - Enter
- [ ] El mensaje aparece como burbuja propia (alineada a la derecha)
- [ ] **Abrir OTRA pestana** del navegador en la misma sala - los mensajes se sincronizan en tiempo real

### F. Django Admin (inspeccionar DB)

Los superusers se crean automaticamente al correr `./start-all.sh`.
Login con `admin/admin123` en cualquier microservicio:

- [ ] http://localhost:8003/admin/geo_app/location/ -> Reportes (editar estado inline)
- [ ] http://localhost:8005/admin/match_app/matchresult/ -> Coincidencias con score
- [ ] http://localhost:8007/admin/notification_app/notification/ -> Notificaciones
- [ ] http://localhost:8002/admin/users/user/ -> Usuarios registrados
- [ ] http://localhost:8001/admin/ -> AuthService
- [ ] http://localhost:8004/admin/ -> ChatService
- [ ] http://localhost:8006/admin/ -> MediaService

Si por algun motivo no podes entrar, re-correr manualmente:
```bash
./entrega/05-demo/seed-admins.sh
```

---

## 5. Si algo falla

```bash
# Ver log en tiempo real del servicio sospechoso:
tail -f logs/auth.log
tail -f logs/match.log
tail -f logs/bff.log
tail -f logs/frontend.log
```

Errores tipicos:
- **"address already in use"**: hay otro proceso en ese puerto. Corre `./stop-all.sh` y reintenta. Si persiste: `lsof -i :8001` para ver quien lo usa.
- **"GEMINI_API_KEY no esta seteada"**: warning normal. MatchService responde con mensaje de error en lugar del analisis. No bloquea el resto del flujo.
- **Frontend dice "Network Error" al login**: revisa `logs/bff.log` y que `:5000` este vivo (`curl http://localhost:5000/api/health`).
- **El reporte no aparece en el mapa**: revisa `logs/geo.log` y que `:8003` este vivo.
- **El chat no se conecta**: revisa `logs/chat.log`. El WS debe escuchar en `ws://localhost:8004/ws/chat/<sala>/`.

---

## 6. Detener todo

```bash
./stop-all.sh
```

Esto mata los procesos por PID guardado en `.pids/` y limpia con `pkill` defensivo.

---

## 7. Reset completo (si quieres empezar de cero)

```bash
./stop-all.sh
rm -rf logs .pids
# Borrar dbs (cuidado: pierdes tus datos demo):
find PROYECTO-fullsatck-3-main/apis -name "db.sqlite3" -delete
./start-all.sh
./entrega/05-demo/seed-demo.sh
```
