# Informe de Pruebas Unitarias - Sanos y Salvos Parcial 3

## Resumen Ejecutivo
- **Total de tests**: 337
- **Tests pasados**: 337 (0 failures)
- **Cobertura minima requerida**: 60%
- **Cobertura minima alcanzada**: 87.1% (GeoService)
- **Cobertura maxima alcanzada**: 100% (AuthService, UserService, MatchService)
- **Cobertura promedio ponderada**: **>94%**

## Tabla de cobertura por servicio

| Servicio | Framework | Tests | Pasados | Cobertura | Reporte HTML |
|---|---|---|---|---|---|
| AuthService | pytest + pytest-django | 11 | 11 | **100.0%** | `apis/microservicios_auth_user-main/auth_user_services/AuthService/htmlcov/` |
| UserService | pytest + pytest-django | 65 | 65 | **100.0%** | `apis/microservicios_auth_user-main/auth_user_services/UserService/htmlcov/` |
| MatchService | pytest + pytest-django | 19 | 19 | **100.0%** | `apis/MatchService-main/htmlcov/` |
| MediaService | pytest + pytest-django | 16 | 16 | 97.6% | `apis/Media-Service-main/htmlcov/` |
| NotificationService | pytest + pytest-django | 30 | 30 | 99.1% | `apis/NotificacionesServices-main/htmlcov/` |
| ChatService | pytest + Channels WebsocketCommunicator | 15 | 15 | 94.6% | `apis/chat-services-main/htmlcov/` |
| GeoService | pytest + pytest-django | 56 | 56 | 87.1% | `apis/sanosysalvos-geoservice-main/htmlcov/` |
| BFF Node | Jest 30 + Supertest (ESM) | 41 | 41 | 96.2% | `frontend_sanos_y_salvos-main/backend/coverage/` |
| Frontend React | Vitest 2 + RTL + jsdom | 84 | 84 | 98.6% | `frontend_sanos_y_salvos-main/coverage/` |
| **TOTAL** | - | **337** | **337** | **>=94% promedio** | - |

## Grafico de cobertura (ASCII)

```
AuthService          ████████████████████ 100.0%
UserService          ████████████████████ 100.0%
MatchService         ████████████████████ 100.0%
NotificationService  ███████████████████░  99.1%
Frontend React       ███████████████████░  98.6%
MediaService         ███████████████████░  97.6%
BFF Node             ███████████████████░  96.2%
ChatService          ███████████████████░  94.6%
GeoService           █████████████████░░░  87.1%
                     ────────────────────
Umbral requerido     ████████████░░░░░░░░  60.0%
```

**Resultado**: los 9 componentes superan ampliamente el 60% requerido.

## Patrones de testing aplicados

### Arrange-Act-Assert (AAA)
Todos los tests siguen la estructura clasica AAA: setup de datos, ejecucion de la accion, asercion del resultado.

### Mocking
- **Python**: `unittest.mock.patch`, `MagicMock`, `AsyncMock` (para consumers).
- **Node**: `jest.unstable_mockModule` (ESM compat), `jest.fn()`.
- **Frontend**: `vi.fn()`, `vi.mock()`, mocks globales para `fetch` y `WebSocket`.

Componentes mockeados:
- **MatchService**: `google.genai.Client` (no se pega a la API real en CI).
- **GeoService**: `safe_request` para `UserServiceClient` / `PetServiceClient`.
- **BFF**: `axios` y `http-proxy`.
- **Frontend**: todos los `*ServiceClient` de `services/api.js`.

### Fixtures
- pytest fixtures (`conftest.py`) para usuarios, tokens JWT, reportes y notificaciones reutilizables.
- Fixtures de imagenes binarias (`SimpleUploadedFile`) para MediaService.

### In-memory channel layer (ChatService)
```python
CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}
```
Permite tests WS sin Redis / Postgres.

### Parametrizacion
- 29 casos para `validate_rut` (`@pytest.mark.parametrize`).
- 12 casos para `validate_phone_cl`.

### APIClient + WebsocketCommunicator
- `rest_framework.test.APIClient` para tests de endpoints REST (con sesion JWT inyectada).
- `channels.testing.WebsocketCommunicator` para WebSocket asincronos.

## Ejemplos de tests destacados

### 1. Test WebSocket con persistencia (ChatService)
```python
@pytest.mark.asyncio
async def test_message_is_broadcast_and_persisted():
    # Arrange: dos communicators en la misma sala.
    comm_a = WebsocketCommunicator(application, "/ws/chat/sala-1/")
    comm_b = WebsocketCommunicator(application, "/ws/chat/sala-1/")
    connected_a, _ = await comm_a.connect()
    connected_b, _ = await comm_b.connect()
    assert connected_a and connected_b

    # Act: A envia, B recibe.
    await comm_a.send_json_to({"message": "hola", "sender": "alice"})
    received = await comm_b.receive_json_from()

    # Assert: broadcast OK + persistencia en DB.
    assert received["message"] == "hola"
    assert await Message.objects.acount() == 1

    await comm_a.disconnect()
    await comm_b.disconnect()
```

### 2. Test mock de Gemini AI (MatchService)
```python
@patch("match_app.services.gemini_service.genai.Client")
def test_analyze_image_success(mock_client_cls):
    # Arrange: mock del SDK Gemini.
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value.text = "Perro labrador negro"
    mock_client_cls.return_value = mock_client

    # Act
    result = analyze_pet_image(reporte_id=1, pet_type="perro", image_bytes=b"...")

    # Assert
    assert result["descripcion_automatica"] == "Perro labrador negro"
    mock_client.models.generate_content.assert_called_once()
```
Cubre el path de exito + 6 ramas de error (rate limit, network, invalid mime, etc).

### 3. Test parametrizado de validator RUT chileno (UserService)
```python
@pytest.mark.parametrize("rut, valido", [
    ("12.345.678-5", True),
    ("11.111.111-1", True),
    ("17.685.439-5", True),
    ("76.086.428-5", True),
    # ... mas validos ...
    ("12.345.678-9", False),  # DV incorrecto
    ("00.000.000-0", False),  # cero invalido
    ("abc", False),
    ("", False),
    # ... mas invalidos ...
])
def test_validate_rut(rut, valido):
    if valido:
        assert validate_rut(rut) is None  # no lanza
    else:
        with pytest.raises(ValidationError):
            validate_rut(rut)
```

### 4. Test BFF con http-proxy mockeado (Node ESM)
```js
const fakeProxy = { on: jest.fn(), web: jest.fn() };
jest.unstable_mockModule('http-proxy', () => ({
  default: { createProxyServer: () => fakeProxy },
}));
const { default: matchRouter } = await import('../routes/match.js');

test('reescribe URL a /api/match/analyze/ y reenvia al target', (done) => {
  fakeProxy.web.mockImplementation((req, res, opts) => {
    expect(req.url).toBe('/api/match/analyze/');
    expect(opts.target).toBe('http://localhost:8005');
    res.status(202).json({ ok: true });
  });
  request(makeApp(matchRouter, '/api/match'))
    .post('/api/match/analyze').send({ foo: 'bar' })
    .expect(202).end(done);
});
```

### 5. Test React hook con WebSocket mockeado (useChat)
```js
test('mensajes recibidos se agregan al state', async () => {
  const mockWs = new MockWS();
  chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
  chatServiceClient.connectToRoom.mockReturnValue(mockWs);
  const { result } = renderHook(() => useChat('sala-1'));
  await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());

  act(() => mockWs._triggerOpen());
  act(() => mockWs._triggerMessage({ message: 'hola', sender: 'alice' }));
  expect(result.current.messages).toHaveLength(1);
  expect(result.current.messages[0]).toEqual({ message: 'hola', sender: 'alice' });
});
```

## Excluidos del coverage (con justificacion)
| Archivo | Razon |
|---|---|
| `routes/admin.js` (BFF) | 550 LOC, requiere mockear `fs` + `fetch` global; cubrimos login + middleware. |
| `server.js` (BFF) | Bootstrap puro (Express listen). |
| `components/Chat/ChatWindow.jsx` | Requiere WS activo y DOM rico - amerita E2E (Playwright). |
| `components/ReportForm/ReportForm.jsx` | 355 LOC con mapas + multipart - amerita E2E. |
| `hooks/index.js` | Solo re-exports (sin logica). |
| `admin.py` (GeoService) | Django admin auto-generado. |

## Como correr todos los tests
```bash
# Microservicios Django (en cada uno)
cd apis/<microservicio>
source .venv/bin/activate
pytest --cov --cov-report=html

# BFF Node
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main/backend
npm run test:coverage

# Frontend React
cd PROYECTO-fullsatck-3-main/frontend_sanos_y_salvos-main
npm run test:coverage
```

## Estrategia de evolucion (futuro)
- **E2E con Playwright** para flujos completos (registro -> reportar -> match -> chat).
- **Tests de contrato (Pact)** entre BFF y microservicios.
- **Performance tests (k6)** para endpoints de busqueda geografica.
- **CI/CD** con GitHub Actions: ejecutar todos los tests en cada PR + bloquear merge si cobertura baja del 60%.
