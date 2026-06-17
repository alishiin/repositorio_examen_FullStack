# 📮 Guía: Testear Geo Service en Postman (Actualizada)

## ✨ Cambios recientes:
- ✅ IDs **numéricas** simples: `1`, `3`, `4` (sin UUIDs)
- ✅ URLs sin `/v1/`: `/api/ubicaciones/` en lugar de `/api/v1/locations/`
- ✅ Endpoints en **español**: `ubicaciones`, `buscar_cercanos`
- ✅ **3 perros en Santiago, Chile** listos para probar

---

## 🚀 Iniciar el servidor

```bash
cd c:\Users\sekai\Downloads\geo_service
python manage.py runserver
```

Deberías ver:
```
Starting development server at http://127.0.0.1:8000/
```

---

## 🎬 Configurar Postman

### 1. Crear Colección
1. Abre **Postman**
2. Click **Collections** → **+ Create**
3. Nombre: `Geo Service - Santiago`
4. Click **Create**

### 2. Crear Variable de Entorno
1. Click **Environments** → **+ Create**
2. Nombre: `Local Dev`
3. Agregar variable:
   - Name: `base_url`
   - Initial value: `http://localhost:8000`
   - Current value: `http://localhost:8000`
4. Click **Save**

---

## 📝 Requests Listos para Copiar/Pegar

### 1️⃣ Health Check (Verificar servidor)

**Método:** `GET`  
**URL:** `{{base_url}}/health`

**Respuesta esperada (200):**
```json
{
    "status": "healthy",
    "database": {
        "status": "healthy",
        "message": "Database connection successful"
    }
}
```

---

### 2️⃣ Ver TODOS los perros

**Método:** `GET`  
**URL:** `{{base_url}}/api/ubicaciones/`

**Respuesta (200):**
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "titulo": "Beagle perdido en Providencia, Santiago",
            "tipo_animal": "perro",
            "tipo_reporte": "perdido",
            "latitud": -33.4269,
            "longitud": -70.4103,
            "raza_probable": "Beagle",
            "color": "Tricolor",
            "tamaño": "pequeno"
        },
        {
            "id": 3,
            "titulo": "Labrador dorado perdido en Estacion Central, Santiago",
            "tipo_animal": "perro",
            "tipo_reporte": "perdido",
            "latitud": -33.4428,
            "longitud": -70.6761,
            "raza_probable": "Labrador",
            "color": "Dorado",
            "tamaño": "grande"
        },
        {
            "id": 4,
            "titulo": "Boxer perdido en Quinta Normal, Santiago",
            "tipo_animal": "perro",
            "tipo_reporte": "perdido",
            "latitud": -33.4408,
            "longitud": -70.6903,
            "raza_probable": "Boxer",
            "color": "Brindle",
            "tamaño": "mediano"
        }
    ]
}
```

---

### 3️⃣ Obtener UN perro específico (por ID)

**Método:** `GET`  
**URL:** `{{base_url}}/api/ubicaciones/1/`

O también:
```
GET {{base_url}}/api/ubicaciones/3/
GET {{base_url}}/api/ubicaciones/4/
```

**Respuesta (200):**
```json
{
    "id": 1,
    "reporte_id": "REP-PERRO-001",
    "pet_id": "PET-BEAGLE-001",
    "usuario_id": "USER-JUAN-001",
    "titulo": "Beagle perdido en Providencia, Santiago",
    "descripcion": "Perro pequeno, collar rojo, sin microchip. Desaparecio el 5 de mayo",
    "latitud": -33.4269,
    "longitud": -70.4103,
    "tipo_animal": "perro",
    "raza_probable": "Beagle",
    "color": "Tricolor",
    "tamaño": "pequeno",
    "tipo_reporte": "perdido",
    "fecha_reporte": "2026-05-05T09:30:00-05:00",
    "fecha_actualizacion": "2026-05-08T23:27:47.623145-05:00"
}
```

---

### 4️⃣ ⭐ BUSCAR PERROS CERCANOS (El endpoint estrella)

**Método:** `POST`  
**URL:** `{{base_url}}/api/ubicaciones/buscar_cercanos/`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "latitud": -33.4350,
    "longitud": -70.5500,
    "radio_km": 10,
    "tipo_reporte": "ambos",
    "limite": 20
}
```

**Respuesta (200) - Te mostrará los 3 perros dentro del radio:**
```json
{
    "latitud": -33.4350,
    "longitud": -70.5500,
    "radio_km": 10,
    "reportes": [
        {
            "id": 1,
            "titulo": "Beagle perdido en Providencia, Santiago",
            "tipo_animal": "perro",
            "raza_probable": "Beagle",
            "distancia_km": 8.2,
            "tipo_reporte": "perdido"
        },
        {
            "id": 3,
            "titulo": "Labrador dorado perdido en Estacion Central, Santiago",
            "tipo_animal": "perro",
            "raza_probable": "Labrador",
            "distancia_km": 3.5,
            "tipo_reporte": "perdido"
        },
        {
            "id": 4,
            "titulo": "Boxer perdido en Quinta Normal, Santiago",
            "tipo_animal": "perro",
            "raza_probable": "Boxer",
            "distancia_km": 4.1,
            "tipo_reporte": "perdido"
        }
    ]
}
```

---

### 5️⃣ Crear NUEVO perro

**Método:** `POST`  
**URL:** `{{base_url}}/api/ubicaciones/`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "reporte_id": "REP-CANICHE-005",
    "pet_id": "PET-CANICHE-005",
    "usuario_id": "USER-PEDRO-005",
    "titulo": "Caniche blanco perdido en Ñuñoa",
    "descripcion": "Perro pequeno, muy jugueton, collar rosa",
    "latitud": -33.4280,
    "longitud": -70.5670,
    "tipo_animal": "perro",
    "raza_probable": "Caniche",
    "color": "Blanco",
    "tamaño": "pequeno",
    "tipo_reporte": "perdido"
}
```

**Respuesta (201 Created):**
```json
{
    "id": 5,
    "reporte_id": "REP-CANICHE-005",
    "titulo": "Caniche blanco perdido en Ñuñoa",
    ...
}
```

---

### 6️⃣ Filtrar por tipo de animal

**Método:** `GET`  
**URL:** `{{base_url}}/api/ubicaciones/?tipo_animal=perro`

Esto devuelve solo los perros (todos en este caso)

---

### 7️⃣ Buscar por texto

**Método:** `GET`  
**URL:** `{{base_url}}/api/ubicaciones/?search=beagle`

Busca en título, descripción y raza

---

### 8️⃣ Actualizar UN perro (PUT - actualización completa)

**Método:** `PUT`  
**URL:** `{{base_url}}/api/ubicaciones/1/`

**Body:**
```json
{
    "reporte_id": "REP-PERRO-001",
    "pet_id": "PET-BEAGLE-001",
    "titulo": "ENCONTRADO: Beagle en Providencia",
    "descripcion": "Perro fue encontrado el 8 de mayo en buen estado",
    "latitud": -33.4269,
    "longitud": -70.4103,
    "tipo_animal": "perro",
    "raza_probable": "Beagle",
    "color": "Tricolor",
    "tamaño": "pequeno",
    "tipo_reporte": "encontrado"
}
```

**Respuesta (200):**
```json
{
    "id": 1,
    "titulo": "ENCONTRADO: Beagle en Providencia",
    "tipo_reporte": "encontrado",
    ...
}
```

---

### 9️⃣ Actualizar parcial (PATCH - solo campos que cambien)

**Método:** `PATCH`  
**URL:** `{{base_url}}/api/ubicaciones/1/`

**Body (solo cambios):**
```json
{
    "titulo": "Beagle hallado y devuelto al dueño"
}
```

---

### 🔟 Eliminar UN perro

**Método:** `DELETE`  
**URL:** `{{base_url}}/api/ubicaciones/1/`

**Respuesta (204 No Content):** 
```
(sin body)
```

---

## 🎯 Flujo de prueba recomendado

Ejecuta en este orden:

1. ✅ **Health Check** → Verificar servidor activo
2. ✅ **Ver todos** → Ver los 3 perros
3. ✅ **Obtener 1** → Ver detalles del Beagle
4. ✅ **Buscar cercanos** → Ver distancias calculadas
5. ✅ **Crear nuevo** → Agregar un Caniche
6. ✅ **Filtrar** → Ver solo perros
7. ✅ **Buscar texto** → Buscar "labrador"
8. ✅ **Actualizar** → Cambiar tipo_reporte
9. ✅ **Patch** → Cambiar solo el título
10. ✅ **Ver todos** → Verificar cambios
11. ✅ **Eliminar** → Borrar el Caniche

---

## 📊 Resumen de IDs actuales

| ID | Perro | Comuna | Raza |
|---|---|---|---|
| 1 | Beagle | Providencia | Beagle |
| 3 | Labrador | Estación Central | Labrador |
| 4 | Boxer | Quinta Normal | Boxer |

---

## 🗺️ Coordenadas de Santiago

```
Providencia: -33.4269, -70.4103
Estación Central: -33.4428, -70.6761
Quinta Normal: -33.4408, -70.6903
Ñuñoa: -33.4280, -70.5670 (para nuevos registros)
```

---

## 🚨 Códigos de respuesta esperados

| Método | Código | Significado |
|---|---|---|
| GET | 200 | OK |
| POST | 201 | Created (nuevo recurso) |
| PUT | 200 | OK (actualizado) |
| PATCH | 200 | OK (parcial) |
| DELETE | 204 | No Content |
| GET (no existe) | 404 | Not Found |
| POST (error) | 400 | Bad Request |

---

## 💡 Tips importantes

### ✅ Copia fácilmente las URLs
Usa `{{base_url}}` en lugar de escribir toda la URL

### ✅ Reutiliza ambientes
Puedes cambiar entre `Local Dev`, `Staging`, `Production` fácilmente

### ✅ Guarda las respuestas
Usa Tests en Postman para validar automáticamente

### ✅ Prueba el Search
Puedes buscar por cualquier palabra en los campos: "Providencia", "perdido", "pequeno"

---

## 🎊 ¡Listo para probar!

Todos los endpoints están listos. Solo copia-pega en Postman y empieza a explorar 🚀

¿Necesitas más ejemplos o tienes dudas? 😊
