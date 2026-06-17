"""Tests WebSocket del ChatService (FASE 2C).

Usa channels.testing.WebsocketCommunicator con InMemoryChannelLayer
(definida en settings). NO necesita Redis.
"""
import json
import pytest
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async

from chat_service_proj.asgi import application
from chat_app.models import Message


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestChatConsumer:
    """Tests del ChatConsumer (WebSocket end-to-end)."""

    async def _connect(self, room='test-room'):
        communicator = WebsocketCommunicator(application, f'/ws/chat/{room}/')
        connected, _ = await communicator.connect()
        return communicator, connected

    async def test_connect_succeeds(self):
        communicator, connected = await self._connect()
        assert connected is True
        await communicator.disconnect()

    async def test_send_and_receive_message(self):
        communicator, _ = await self._connect('room-A')

        await communicator.send_json_to({
            'message': 'hola',
            'sender': 'alice',
        })

        response = await communicator.receive_json_from(timeout=2)
        assert response['message'] == 'hola'
        assert response['sender'] == 'alice'

        await communicator.disconnect()

    async def test_message_is_persisted_to_db(self):
        communicator, _ = await self._connect('room-persist')

        await communicator.send_json_to({
            'message': 'guardame por favor',
            'sender': 'bob',
        })
        # Espera el echo para asegurar que receive() ya proceso el mensaje.
        await communicator.receive_json_from(timeout=2)
        await communicator.disconnect()

        # Verifica que se guardo en DB.
        count = await database_sync_to_async(
            Message.objects.filter(room_name='room-persist', sender='bob').count
        )()
        assert count == 1

        msg = await database_sync_to_async(
            Message.objects.get
        )(room_name='room-persist', sender='bob')
        assert msg.content == 'guardame por favor'

    async def test_two_clients_same_room_broadcast(self):
        """Dos clientes en la misma sala: lo que envia uno lo recibe el otro."""
        client_a, _ = await self._connect('room-broadcast')
        client_b, _ = await self._connect('room-broadcast')

        await client_a.send_json_to({
            'message': 'broadcast test',
            'sender': 'a',
        })

        # Ambos deben recibir el mismo mensaje (channel layer hace fan-out).
        msg_a = await client_a.receive_json_from(timeout=2)
        msg_b = await client_b.receive_json_from(timeout=2)
        assert msg_a == msg_b
        assert msg_a['message'] == 'broadcast test'
        assert msg_a['sender'] == 'a'

        await client_a.disconnect()
        await client_b.disconnect()

    async def test_disconnect_clean(self):
        communicator, _ = await self._connect('room-disconnect')
        await communicator.disconnect()
        # No exception => success.


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestRoutingConfig:
    """Asegura que la routing config expone la ruta correcta."""

    async def test_invalid_path_raises_value_error(self):
        """channels.routing.URLRouter raisea ValueError si no matchea ninguna ruta."""
        communicator = WebsocketCommunicator(application, '/ws/no-existe/')
        with pytest.raises(ValueError, match='No route found'):
            await communicator.connect()
