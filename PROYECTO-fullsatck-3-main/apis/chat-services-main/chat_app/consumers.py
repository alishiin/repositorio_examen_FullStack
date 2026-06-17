import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Captura el ID de la sala desde la URL del WebSocket
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Une al usuario al grupo de esta sala de chat
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Saca al usuario del grupo cuando se desconecta
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibe un mensaje enviado desde el cliente (React PWA)
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender = data['sender']

        # Guarda el mensaje en la base de datos local de manera asíncrona
        await self.save_message(sender, message)

        # Transmite el mensaje a todos los que estén conectados a esta sala
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender
            }
        )

    # Envía el mensaje de vuelta por el WebSocket a cada miembro del grupo
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))

    @database_sync_to_async
    def save_message(self, sender, message):
        from .models import Message
        return Message.objects.create(room_name=self.room_name, sender=sender, content=message)