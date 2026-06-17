from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Configuración de WebSocket
    path('config/', views.get_chat_config, name='get_chat_config'),
    
    # Validación de acceso a sala
    path('room/<str:room_name>/validate/', views.validate_room_access, name='validate_room_access'),
]
