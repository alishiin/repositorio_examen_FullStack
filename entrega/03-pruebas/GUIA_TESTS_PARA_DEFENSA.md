# Guia de Tests para la Defensa - Sanos y Salvos

> Documento de estudio para exponer y responder preguntas sobre las pruebas
> automatizadas del proyecto. Esta escrito en lenguaje simple, pensado para
> que cualquier integrante del equipo pueda leerlo la noche antes y defender
> el tema con confianza.

---

## 1. Que es un test y por que los hacemos (lo basico)

Un **test** (o "prueba automatizada") es un pequeno programa cuya unica funcion
es revisar que OTRO programa funciona como esperamos.

**Analogia:** antes de entrar a una pieza oscura, prendes la luz para asegurarte
de que no hay nada en el suelo con lo que tropezar. Un test hace eso con el
codigo: lo "prende" y revisa que todo este en su lugar ANTES de que entre el
usuario real.

Para que sirven, en concreto:

1. **Detectan errores antes que el usuario.** Si rompemos algo sin darnos
   cuenta, el test se pone rojo y nos avisa.
2. **Permiten cambiar codigo con confianza.** Podemos modificar una funcion y,
   si los tests siguen verdes, sabemos que no rompimos nada de lo que ya andaba.
3. **Son documentacion viva.** Leer un test es leer un ejemplo real de como se
   usa una funcion y que se espera de ella.

**Frase para la defensa:** "Un test es codigo que prueba codigo. Nos da una red
de seguridad: si cambiamos algo y rompemos otra cosa sin querer, el test nos
avisa al instante en vez de que lo descubra el usuario."

---

## 2. Los 3 mundos de tests del proyecto

El proyecto tiene tres tecnologias distintas, y cada una usa su propia
herramienta de testing. Esto es normal: cada lenguaje tiene su herramienta
estandar, igual que cada idioma tiene su propio diccionario.

| Mundo | Lenguaje | Framework de tests | Donde corre |
|---|---|---|---|
| **Backend** (7 microservicios) | Python / Django | **pytest** | Cada microservicio por separado |
| **BFF** (puerta de entrada) | Node.js / Express | **Jest** | En la carpeta `backend/` del frontend |
| **Frontend** (la web) | JavaScript / React | **Vitest** | En la carpeta `src/` del frontend |

**Por que 3 frameworks distintos:** no es un capricho. pytest es el estandar de
Python, Jest es el estandar historico de Node, y Vitest es el estandar moderno
para proyectos hechos con Vite (la herramienta con la que se construye nuestra
web React). Usar la herramienta estandar de cada mundo nos da mejor soporte,
documentacion y velocidad.

**Frase para la defensa:** "Tenemos tres frameworks porque tenemos tres
lenguajes. pytest para Python, Jest para el BFF en Node, y Vitest para el
frontend en React. Cada uno es la herramienta estandar de su ecosistema."

---

## 3. Tipos de tests que usamos

### Test unitario (prueba una pieza aislada)
Prueba una sola funcion, sola, sin nada alrededor.
**Analogia:** probar que UNA pila tiene carga, sin meterla todavia en el control
remoto.
**Ejemplo en el proyecto:** la funcion que calcula la distancia entre dos puntos
del mapa (Haversine) en el MatchService.

### Test de integracion (prueba varias piezas juntas)
Prueba que varias partes funcionan bien conectadas entre si.
**Analogia:** meter la pila en el control remoto y probar que efectivamente
cambia el canal del televisor.
**Ejemplo en el proyecto:** crear un reporte via la API y verificar que quedo
guardado en la base de datos.

### Test de API / endpoints (prueba una "puerta" del sistema)
Simula una peticion (como la que hace el navegador) y revisa la respuesta.
**Analogia:** tocar el timbre de una casa y verificar que abren la puerta
correcta.
**Ejemplo en el proyecto:** pedirle al BFF la configuracion del chat y revisar
que devuelve la URL correcta.

### Test de WebSocket (prueba conexion en tiempo real)
El chat no es una peticion normal: es una conexion que queda abierta y por la
que van y vienen mensajes en vivo. Necesita un tipo de test especial.
**Analogia:** probar una llamada telefonica (linea abierta) en vez de mandar
una carta (mensaje suelto).
**Ejemplo en el proyecto:** conectarse a una sala de chat, mandar un mensaje y
verificar que se guarda y se reenvia.

---

## 4. Conceptos clave explicados para dummies

### Mocking (simular / usar un doble)
Un **mock** es un reemplazo falso de algo real, que se comporta como queremos
para el test.

**Analogia:** un doble de riesgo en una pelicula. No arriesgamos al actor
principal; usamos a alguien que hace la misma escena de forma controlada.

**Por que lo usamos:** no queremos que cada test llame de verdad a la base de
datos, a otro microservicio o a la API de Google. Seria lento, costaria dinero
y dependeria de internet. En vez de eso, "simulamos" esas respuestas.

**Donde:** en el frontend simulamos las llamadas de red (`fetch`); en el BFF
simulamos las respuestas de los microservicios; en MatchService simulamos la
respuesta de la inteligencia artificial de Google.

### Fixtures (preparacion previa)
Una **fixture** es la preparacion que se hace ANTES de cada test: crear datos de
prueba, un usuario falso, un cliente listo para usar, etc.

**Analogia:** el chef que deja todos los ingredientes cortados y medidos antes
de empezar a cocinar (lo que en cocina se llama "mise en place").

**Ejemplo real:** en UserService hay un archivo `conftest.py` que fabrica
usuarios de prueba con RUT chileno valido, para que cada test arranque con datos
listos sin tener que crearlos a mano.

### Coverage (cobertura)
La **cobertura** es el porcentaje del codigo que los tests "tocan" al menos una
vez.

**Analogia:** si tu casa tiene 10 ampolletas y revisaste 9, tu cobertura es del
90 por ciento. Queda una que no probaste y podria estar quemada.

**Nuestro numero:** la mayoria de los servicios tiene mas del 90 por ciento de
cobertura, lo que se considera muy bueno. No llegamos al 100 porque hay codigo
de manejo de errores muy raros que casi nunca ocurre.

### Assert (afirmar)
El **assert** es el corazon de todo test: la linea donde decimos "yo AFIRMO que
esto tiene que ser igual a aquello". Si la afirmacion es verdadera, el test
pasa (verde); si es falsa, el test falla (rojo).

**Analogia:** "afirmo que 2 + 2 da 4". Si la calculadora dice otra cosa, algo
esta roto.

---

## 5. Donde esta cada cosa (mapa de ubicaciones)

### Backend Python (pytest) - 7 microservicios

| Servicio | Archivos de test | Que prueban |
|---|---|---|
| **MatchService** | `test_matching.py`, `test_find_matches.py`, `test_match.py` | Logica de scoring (calculo de distancia Haversine, puntaje de coincidencia), endpoint de busqueda de matches |
| **GeoService** | `test_models.py`, `test_serializers.py`, `test_api.py`, `test_extra_coverage.py`, `test_circuit_breaker.py`, `test_health_checks.py`, `test_integration.py` | Modelos, serializers, API de ubicaciones, circuit breaker, health checks |
| **UserService** | `test_models.py`, `test_serializers.py`, `test_validators.py`, `test_views.py` (+ `conftest.py`) | Modelo de usuario, validadores de RUT y telefono chilenos, endpoints CRUD |
| **AuthService** | `test_jwt_flow.py` | Login y emision/validacion de tokens JWT |
| **ChatService** | `test_consumers.py`, `test_http.py` | WebSocket del chat (mensajes, historial), endpoints HTTP de configuracion |
| **MediaService** | `test_media.py` | Subida de imagenes, serializer que devuelve URL absoluta |
| **NotificationService** | `test_notifica*.py` | Creacion de notificaciones, marcar como leida, disparo por match |

### BFF Node.js (Jest) - carpeta `frontend_sanos_y_salvos-main/backend/__tests__/`
`admin.test.js`, `pets.test.js`, `clinics.test.js`, `auth.test.js`,
`chat.test.js`, `media.test.js`, `notifications.test.js`, `match.test.js`
- Prueban las rutas del BFF: login de admin, CRUD de mascotas, los proxies hacia
  los microservicios y el manejo de errores.

### Frontend React (Vitest) - carpeta `frontend_sanos_y_salvos-main/src/**/__tests__/`
- **Servicios / API:** `services/__tests__/api.test.js`, `api/__tests__/client.test.js`
- **Hooks:** `useChat`, `useFindMatches`, `useGeoService`, `useMediaUpload`, `useMatchAnalysis`, `useNotifications`
- **Context:** `AuthContext.test.jsx`
- **Utils:** `imageUrl.test.js`
- **Componentes:** `MatchResults`, `NotificationList`, `NotificationBell`, `ChatRoomList`

### Totales
- Aproximadamente **390 a 400 tests** en total.
- Cobertura superior al **90 por ciento** en la mayoria de los servicios.

---

## 6. Que prueba cada servicio (explicado simple)

**MatchService (el cerebro de las coincidencias).** Prueba que el calculo de
distancia entre dos puntos del mapa sea correcto y que el puntaje de coincidencia
entre una mascota perdida y una encontrada tenga sentido. Si fallara, el sistema
podria emparejar mascotas que no tienen nada que ver.

**GeoService (los reportes en el mapa).** Prueba que los reportes se guarden bien,
que la API responda correctamente y que el "circuit breaker" (un mecanismo de
proteccion) corte la conexion si otro servicio se cae. Si fallara, los reportes
podrian guardarse mal o el sistema entero caerse en cadena.

**UserService (los usuarios).** Prueba que los RUT y telefonos chilenos se validen
bien y que el alta/edicion de usuarios funcione. Si fallara, podrian registrarse
usuarios con datos invalidos.

**AuthService (el login).** Prueba que el inicio de sesion entregue un token valido
y que ese token se pueda verificar. Si fallara, cualquiera podria entrar o nadie
podria.

**ChatService (el chat en vivo).** Prueba que el WebSocket conecte, que los
mensajes se guarden y que al entrar a una sala se cargue el historial. Si fallara,
los mensajes se perderian al recargar.

**MediaService (las fotos).** Prueba que las imagenes se suban y que devuelva una
URL completa para mostrarlas. Si fallara, las fotos no se verian en el mapa.

**NotificationService (los avisos).** Prueba que se creen notificaciones cuando hay
un match y que se puedan marcar como leidas. Si fallara, los usuarios no se
enterarian de las coincidencias.

**BFF (la puerta de entrada).** Prueba que reenvie bien las peticiones a cada
microservicio y maneje los errores. Si fallara, el frontend no podria hablar con
el backend.

**Frontend (la web).** Prueba que los hooks, servicios y componentes muestren y
manejen los datos correctamente. Si fallara, el usuario veria cosas rotas en
pantalla.

---

## 7. Ejemplos reales comentados

A continuacion, fragmentos REALES de nuestro codigo de tests, explicados linea
por linea.

### Ejemplo 1: Test unitario puro (MatchService - distancia en el mapa)
Archivo: `apis/MatchService-main/match_app/tests/test_matching.py`

```python
class TestHaversine:
    def test_punto_consigo_mismo_es_cero(self):
        assert haversine_km(-33.4489, -70.6693, -33.4489, -70.6693) == pytest.approx(0.0)

    def test_distancia_santiago_valparaiso_aprox_100km(self):
        # Santiago (Plaza Italia) -> Valparaiso (Plaza Sotomayor) ~107 km
        d = haversine_km(-33.4378, -70.6504, -33.0472, -71.6127)
        assert 95 < d < 115
```

**Explicacion simple:**
- `haversine_km(...)` es la funcion que calcula cuantos kilometros hay entre dos
  puntos del mapa (dadas sus coordenadas).
- El primer test afirma que la distancia de un punto **consigo mismo** debe ser
  **cero**. Logico: no te moviste.
- `pytest.approx(0.0)` significa "aproximadamente cero", porque los calculos con
  decimales nunca dan exactamente 0.000000, sino algo como 0.0000001.
- El segundo test usa coordenadas reales de Santiago y Valparaiso (que estan a
  unos 107 km) y afirma que el resultado debe caer **entre 95 y 115 km**. Usamos
  un rango porque el calculo es una aproximacion, no un valor exacto.

**Por que importa:** si este calculo estuviera mal, el sistema diria que dos
mascotas estan cerca cuando en realidad estan en ciudades distintas.

### Ejemplo 2: Test de validacion (UserService - RUT chileno)
Archivo: `apis/.../UserService/users/tests/test_validators.py`

```python
class TestValidateChileanRut:
    @pytest.mark.parametrize('rut', [
        '12345678-5',
        '12.345.678-5',  # formato con puntos
    ])
    def test_valid_ruts_pass(self, rut):
        # No debe lanzar.
        validate_chilean_rut(rut)

    @pytest.mark.parametrize('rut', [
        '12345678-9',          # DV incorrecto
        'abcdefgh-5',          # letras
        '',                    # vacio
    ])
    def test_invalid_ruts_raise(self, rut):
        with pytest.raises(ValidationError):
            validate_chilean_rut(rut)
```

**Explicacion simple:**
- `@pytest.mark.parametrize` es un truco para correr el MISMO test con varios
  valores distintos. En vez de escribir un test por cada RUT, escribimos uno y le
  pasamos una lista.
- El primer bloque prueba RUT **validos**: el test pasa si la funcion NO se queja.
- El segundo bloque prueba RUT **invalidos** (digito verificador malo, letras,
  vacio): el test pasa si la funcion SI se queja, lanzando un error
  (`ValidationError`).
- `with pytest.raises(ValidationError)` significa "espero que aqui adentro
  explote con este error especifico". Si NO explota, el test falla.

**Por que importa:** asegura que no se registren usuarios con RUT falsos o mal
escritos.

### Ejemplo 3: Fixture / preparacion (UserService - conftest.py)
Archivo: `apis/.../UserService/users/tests/conftest.py`

```python
@pytest.fixture
def user_factory(db):
    """Fabrica de usuarios para tests (asegura RUT unico por llamada)."""
    counter = {'i': 0}

    def _make(**overrides):
        counter['i'] += 1
        i = counter['i']
        defaults = {
            'username': f'user_{i}',
            'email': f'user_{i}@example.com',
            'rut': VALID_RUTS[(i - 1) % len(VALID_RUTS)],
            # ...
        }
        defaults.update(overrides)
        user = User(**defaults)
        user.set_password('supersecret123')
        user.save()
        return user

    return _make
```

**Explicacion simple:**
- Una **fixture** es codigo de preparacion que otros tests pueden pedir.
- Esta se llama `user_factory` (fabrica de usuarios). Cualquier test que la pida
  recibe una funcion para crear usuarios de prueba al instante.
- El `counter` asegura que cada usuario creado tenga un nombre y RUT distintos
  (user_1, user_2...), para que no choquen entre si.
- `set_password(...)` guarda la contrasena **encriptada**, igual que en produccion.
- Asi, en vez de repetir el codigo de "crear usuario" en 30 tests, lo escribimos
  una vez aqui (principio DRY: no te repitas).

**Por que importa:** ahorra codigo repetido y hace que los tests sean mas faciles
de leer y mantener.

### Ejemplo 4: Test frontend simple (utilidad de URL de imagenes)
Archivo: `frontend_sanos_y_salvos-main/src/utils/__tests__/imageUrl.test.js`

```javascript
describe('resolveImageUrl', () => {
  test('devuelve URL absoluta http tal cual', () => {
    const url = 'http://localhost:8006/media/pets_uploaded/abc.jpg';
    expect(resolveImageUrl(url)).toBe(url);
  });

  test('antepone el host a ruta relativa /media/...', () => {
    expect(resolveImageUrl('/media/pets_uploaded/abc.jpg'))
      .toBe('http://localhost:8006/media/pets_uploaded/abc.jpg');
  });
});
```

**Explicacion simple:**
- `describe(...)` agrupa varios tests relacionados bajo un mismo titulo.
- `test(...)` es cada prueba individual.
- `resolveImageUrl` es una funcion que arregla las direcciones de las fotos.
- El primer test: si le pasas una direccion **completa** (que empieza con http),
  la deja igual.
- El segundo test: si le pasas una direccion **a medias** (`/media/...`), le pega
  adelante la direccion del servidor de fotos para completarla.
- `expect(X).toBe(Y)` es la version JavaScript del assert: "espero que X sea
  igual a Y".

**Por que importa:** esta funcion arreglo un bug real donde las fotos no se veian
porque la direccion estaba incompleta.

### Ejemplo 5: Test de API con supertest (BFF - chat)
Archivo: `frontend_sanos_y_salvos-main/backend/__tests__/chat.test.js`

```javascript
describe('GET /api/chat/config', () => {
  test('200 con wsUrl default', async () => {
    delete process.env.CHAT_SERVICE_URL;
    const res = await request(app).get('/api/chat/config');
    expect(res.status).toBe(200);
    expect(res.body.wsUrl).toBe('ws://localhost:8004');
  });
});
```

**Explicacion simple:**
- `supertest` (la funcion `request`) simula una peticion HTTP a nuestro servidor,
  como si fuera el navegador, pero sin levantar nada de verdad.
- `request(app).get('/api/chat/config')` es como escribir esa direccion en el
  navegador.
- `expect(res.status).toBe(200)`: 200 es el codigo que significa "todo bien". El
  test afirma que el servidor responde OK.
- `expect(res.body.wsUrl).toBe('ws://localhost:8004')`: afirma que la respuesta
  trae la direccion correcta del chat.

**Por que importa:** verifica que la "puerta de entrada" del sistema responda bien
sin tener que abrir el navegador a mano cada vez.

### Ejemplo 6: Test de WebSocket (ChatService - lo mas complejo)
Archivo: `apis/chat-services-main/chat_app/tests/test_consumers.py`

```python
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestChatConsumer:

    async def _connect(self, room='test-room'):
        communicator = WebsocketCommunicator(application, f'/ws/chat/{room}/')
        connected, _ = await communicator.connect()
        return communicator, connected

    async def test_connect_sends_history_frame_first(self):
        communicator, history = await self._connect_and_drain_history('room-hist-empty')
        assert history['type'] == 'history'
        assert history['messages'] == []  # sala vacia => historial vacio
        await communicator.disconnect()
```

**Explicacion simple:**
- El chat es en **tiempo real**, asi que no se prueba con una peticion normal,
  sino con un `WebsocketCommunicator`: un "telefono de prueba" que abre la linea.
- `@pytest.mark.asyncio` indica que el test es **asincrono** (espera respuestas
  que llegan con el tiempo, como en una conversacion).
- `@pytest.mark.django_db` le da permiso al test para usar una base de datos de
  prueba (que se borra al terminar).
- El test se conecta a una sala vacia y afirma que lo primero que recibe es un
  mensaje de tipo `history` (historial) con una lista **vacia**, porque nadie
  escribio nada todavia.
- `await` significa "espera a que esto termine antes de seguir", tipico de codigo
  asincrono.

**Por que importa:** garantiza que al entrar a una sala se cargue el historial de
mensajes, que era una funcionalidad clave del chat.

---

## 8. Como correr los tests

### Backend Python (cualquier microservicio)
```bash
cd PROYECTO-fullsatck-3-main/apis/MatchService-main
source .venv/bin/activate
pytest
deactivate
```

### BFF Node.js
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main/backend
npm test
```

### Frontend React
```bash
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main
npm test
```

**Como leer el resultado:**
- **Verde / "passed":** todo bien, el codigo funciona como se espera.
- **Rojo / "failed":** algo se rompio. La salida indica QUE test fallo y por que
  (que esperaba y que recibio en su lugar).
- Al final suele aparecer un resumen tipo `54 passed` o `108 passed`, que es la
  cantidad de pruebas que pasaron.

---

## 9. Banco de preguntas para la defensa

**1. Por que usan tres frameworks de testing distintos?**
Porque tenemos tres lenguajes distintos. pytest es el estandar de Python, Jest el
del BFF en Node y Vitest el del frontend en React. Cada uno es la herramienta
estandar de su ecosistema.

**2. Que es el mocking y donde lo usan?**
Mocking es reemplazar algo real por un doble controlado. Lo usamos para no llamar
de verdad a la base de datos, a otros microservicios o a la API de Google en cada
test. Por ejemplo, en el frontend simulamos las llamadas de red.

**3. Como prueban algo que depende de una base de datos?**
Django crea una base de datos de prueba temporal solo para los tests, que se borra
al terminar. La activamos con la marca `@pytest.mark.django_db`. Asi probamos con
datos reales sin tocar la base de produccion.

**4. Cual es la diferencia entre un test unitario y uno de integracion?**
El unitario prueba una sola funcion aislada (por ejemplo, el calculo de distancia).
El de integracion prueba varias piezas juntas (por ejemplo, crear un reporte por la
API y verificar que quedo en la base de datos).

**5. Como prueban el WebSocket del chat si es en tiempo real?**
Con una herramienta especial llamada WebsocketCommunicator, que abre una conexion
de prueba (como un telefono de prueba), manda un mensaje y verifica que se guarde y
se reenvie. Son tests asincronos.

**6. Que cobertura tienen y que significa?**
Mas del 90 por ciento en la mayoria de servicios. Significa que mas del 90 por
ciento de las lineas de codigo son ejecutadas por al menos un test. Es un indicador
de que casi todo el codigo esta probado.

**7. Por que testear el calculo de distancia (Haversine)?**
Porque es el corazon del sistema de coincidencias. Si calculara mal, emparejaria
mascotas que estan en ciudades distintas o no detectaria las que estan realmente
cerca.

**8. Que pasa si cambian codigo y un test se pone rojo?**
El test rojo nos avisa que rompimos algo. Revisamos: o arreglamos el codigo, o, si
el cambio era intencional, actualizamos el test para que refleje el nuevo
comportamiento esperado.

**9. Como prueban el login sin exponer contrasenas reales?**
Usamos usuarios de prueba creados al vuelo con contrasenas falsas, guardadas
encriptadas igual que en produccion. Nunca usamos credenciales reales en los tests.

**10. Por que el frontend y el backend se testean por separado?**
Porque son programas distintos, en lenguajes distintos, que corren en lugares
distintos. Cada uno tiene su responsabilidad y se prueba con su herramienta. Asi,
si algo falla, sabemos exactamente en que capa esta el problema.

**11. Que es una fixture y para que sirve?**
Es codigo de preparacion que se ejecuta antes de un test: crea datos, usuarios o
clientes listos para usar. Evita repetir el mismo codigo de preparacion en cada
test (principio DRY).

**12. Que es un assert?**
Es la afirmacion central de un test: "afirmo que esto debe ser igual a aquello". Si
es verdad, el test pasa; si no, falla. Es donde realmente se verifica el resultado.

**13. Que es el circuit breaker que mencionan en GeoService y como lo prueban?**
Es un mecanismo que corta la conexion a otro servicio si ese servicio se esta
cayendo, para no arrastrar la caida. Lo probamos simulando fallas y verificando que
el "interruptor" se abra y proteja al sistema.

**14. Cuantos tests tienen en total?**
Entre 390 y 400 tests aproximadamente, repartidos entre los siete microservicios,
el BFF y el frontend.

**15. Que es supertest y donde lo usan?**
Es una herramienta para probar APIs simulando peticiones HTTP sin levantar el
servidor real. Lo usamos en el BFF (en Node con Jest) para probar sus rutas, como
el login de admin o la configuracion del chat.

**16. Por que algunos tests usan parametrize?**
Para correr el mismo test con muchos valores distintos sin repetir codigo. Por
ejemplo, probamos decenas de RUT validos e invalidos con un solo test parametrizado.

**17. Que prueban en MediaService?**
Que las imagenes se suban correctamente y que el sistema devuelva una direccion
completa (URL absoluta) para poder mostrarlas. Esto arreglo un bug donde las fotos
no se veian.

**18. Como saben que un test es bueno?**
Un buen test prueba una cosa concreta, tiene un assert claro, no depende de otros
tests y da el mismo resultado cada vez que se corre. Si pasa, nos da confianza
real; si falla, nos dice exactamente que reviser.

**19. Que pasaria si no tuvieran tests?**
Cada cambio seria un riesgo: podriamos romper algo sin enterarnos hasta que un
usuario lo reporte. Los tests nos permiten avanzar rapido y con seguridad.

**20. Probaron tambien los casos de error, no solo los exitosos?**
Si. Por ejemplo, probamos que un RUT invalido sea rechazado, que un login con
contrasena mala devuelva error, y que el sistema responda bien cuando un servicio
externo falla. Probar los errores es tan importante como probar los aciertos.

---

## 10. Resumen ejecutivo (para arrancar la exposicion)

El proyecto Sanos y Salvos cuenta con aproximadamente 390 a 400 tests automatizados
que cubren las tres capas del sistema: los siete microservicios en Python (con
pytest), la puerta de entrada o BFF en Node (con Jest) y la interfaz web en React
(con Vitest). La cobertura supera el 90 por ciento en la mayoria de los servicios,
lo que significa que casi todo el codigo esta verificado por al menos una prueba.
Estos tests revisan desde la logica matematica de las coincidencias y la validacion
de RUT chilenos, hasta el chat en tiempo real y la subida de fotos. En conjunto,
nos dan una red de seguridad que permite cambiar y mejorar el codigo con confianza,
detectando errores antes de que lleguen al usuario.
