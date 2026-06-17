from django.db import models

class Message(models.Model):
    # El room_name puede ser el ID del reporte de la mascota para agrupar el chat de ese caso
    room_name = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)  # ID del usuario que envía el mensaje
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.content[:20]} ({self.room_name})"