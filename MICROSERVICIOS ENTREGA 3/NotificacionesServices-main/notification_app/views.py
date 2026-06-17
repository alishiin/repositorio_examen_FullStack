from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import TriggerNotificationSerializer
from .services import NotificationSenderService
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class TriggerMatchNotificationView(APIView):
    def post(self, request):
        try:
            # 1. Pasamos los datos del JSON al serializador
            serializer = TriggerNotificationSerializer(data=request.data)
            
            # 2. Validamos si el JSON trae todo lo necesario (user_id, user_email, etc.)
            if serializer.is_valid():
                data = serializer.validated_data
                
                # 3. Llamamos al servicio para procesar la notificación
                success = NotificationSenderService.send_match_notification(
                    user_email=data['user_email'],
                    user_id=data['user_id'],
                    match_id=data['match_id'],
                    pet_name=data['pet_name']
                )
                
                if success:
                    return Response({
                        "success": True,
                        "message": "Notificación enviada exitosamente",
                        "notification_id": f"notif_{data['user_id']}_{data['match_id']}"
                    }, status=status.HTTP_200_OK)
                return Response({
                    "success": False,
                    "error": "Error interno al procesar el envío"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Si el JSON está mal estructurado, devuelve los errores
            logger.error(f"Validation errors: {serializer.errors}")
            return Response({
                "success": False,
                "error": "Parámetros inválidos",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.exception(f"Error en TriggerMatchNotificationView: {str(e)}")
            return Response({
                "success": False,
                "error": f"Error interno: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)