from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Notification
from .serializers import TriggerNotificationSerializer, NotificationSerializer
from .services import NotificationSenderService
import logging

logger = logging.getLogger(__name__)


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/?user_id=X -> lista notificaciones del usuario (in-app)."""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Notification.objects.filter(user_id=user_id).order_by('-created_at')
        return Notification.objects.none()


@method_decorator(csrf_exempt, name='dispatch')
class NotificationMarkReadView(APIView):
    """POST /api/notifications/<pk>/mark-read/ -> marca como leida."""

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk)
            notif.read = True
            notif.save(update_fields=['read'])
            return Response({'success': True, 'id': notif.id, 'read': True})
        except Notification.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Notificacion no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )


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