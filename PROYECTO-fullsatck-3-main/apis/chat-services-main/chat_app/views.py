from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import os

# Health check endpoint
@require_http_methods(["GET"])
def health_check(request):
    """
    Verifica que el servicio de chat esté activo y disponible
    GET /api/chat/health/
    """
    return JsonResponse({
        'status': 'OK',
        'service': 'Chat Service',
        'message': 'Chat Service is running correctly'
    })

@require_http_methods(["GET"])
@csrf_exempt
def get_chat_config(request):
    """
    Retorna la configuración para conectarse al Chat WebSocket Service
    GET /api/chat/config/
    Respuesta: { wsUrl, message }
    """
    try:
        ws_port = os.getenv('CHAT_WS_PORT', '8004')
        ws_host = os.getenv('CHAT_WS_HOST', 'localhost')
        ws_protocol = os.getenv('CHAT_WS_PROTOCOL', 'ws')
        
        ws_url = f"{ws_protocol}://{ws_host}:{ws_port}"
        
        return JsonResponse({
            'success': True,
            'wsUrl': ws_url,
            'message': 'Configuración de chat obtenida exitosamente',
            'endpoints': {
                'ws_connection': f"{ws_url}/ws/chat/",
                'room_format': f"{ws_url}/ws/chat/{{room_name}}/"
            }
        })
    except Exception as error:
        return JsonResponse({
            'success': False,
            'message': 'Error obteniendo configuración de chat',
            'error': str(error)
        }, status=500)

@require_http_methods(["GET"])
@csrf_exempt
def validate_room_access(request, room_name):
    """
    Valida si el usuario puede entrar a una sala de chat específica
    GET /api/chat/room/{room_name}/validate/
    Parámetros: room_name (nombre de la sala)
    Respuesta: { wsUrl, room, authorized, message }
    """
    try:
        ws_port = os.getenv('CHAT_WS_PORT', '8004')
        ws_host = os.getenv('CHAT_WS_HOST', 'localhost')
        ws_protocol = os.getenv('CHAT_WS_PROTOCOL', 'ws')
        
        ws_url = f"{ws_protocol}://{ws_host}:{ws_port}"
        
        # TODO: Agregar lógica de autorización según usuario
        authorized = True  # Por ahora siempre autorizado
        
        return JsonResponse({
            'success': True,
            'wsUrl': ws_url,
            'room': room_name,
            'authorized': authorized,
            'wsEndpoint': f"{ws_url}/ws/chat/{room_name}/",
            'message': 'Acceso a sala de chat autorizado'
        })
    except Exception as error:
        return JsonResponse({
            'success': False,
            'message': 'Error validando acceso a sala',
            'error': str(error)
        }, status=500)

