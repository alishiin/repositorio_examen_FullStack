from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # Usamos path común, es más limpio y menos propenso a fallar por caracteres
    path('ws/chat/<str:room_name>/', ChatConsumer.as_asgi()),
]