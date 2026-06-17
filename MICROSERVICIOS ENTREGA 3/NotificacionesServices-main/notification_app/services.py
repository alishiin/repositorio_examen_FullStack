from django.core.mail import send_mail
from django.utils import timezone
from .models import Notification

class NotificationSenderService:
    @staticmethod
    def send_match_notification(user_email, user_id, match_id, pet_name):
        notification = Notification.objects.create(
            user_id=user_id,
            match_id=match_id,
            title="¡Posible coincidencia encontrada!",
            message=f"Hemos detectado una posible coincidencia para tu reporte de {pet_name}.",
            notification_type='MATCH'
        )
        try:
            # Simulación de envío por consola por ahora
            print(f"ENVIANDO CORREO A {user_email}: {notification.title}")

            notification.status = 'SENT'
            notification.sent_at = timezone.now()
            notification.save()
            return True
        except Exception as e:
            notification.status = 'FAILED'
            notification.save()
            return False