from django.db import models

class Notification(models.Model):
    TYPES = (
        ('MATCH', 'Coincidencia de Mascota'),
        ('SYSTEM', 'Mensaje del Sistema'),
    )
    STATUS = (
        ('PENDING', 'Pendiente'),
        ('SENT', 'Enviado'),
        ('FAILED', 'Fallido'),
    )

    user_id = models.IntegerField(help_text="ID del usuario en el User Service")
    match_id = models.IntegerField(null=True, blank=True, help_text="ID del match asociado")
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPES, default='MATCH')
    status = models.CharField(max_length=10, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read = models.BooleanField(default=False, help_text="Marca si el usuario ya vio la notificacion")

    def __str__(self):
        return f"{self.notification_type} - Usuario {self.user_id} - {self.status}"