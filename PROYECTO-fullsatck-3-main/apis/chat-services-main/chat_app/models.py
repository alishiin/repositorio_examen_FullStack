from django.db import models


class Message(models.Model):
    """Mensaje persistido de una sala de chat.

    `room_name` puede ser el ID del reporte de la mascota para agrupar
    el chat de ese caso. Se mantiene el nombre del campo (`room_name`)
    por compatibilidad con la migracion 0001 y los datos existentes.
    """
    # El room_name puede ser el ID del reporte de la mascota para agrupar el chat de ese caso
    room_name = models.CharField(max_length=255, db_index=True)
    sender = models.CharField(max_length=255, default='anonimo')  # ID del usuario que envia el mensaje
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room_name', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.sender}: {self.content[:20]} ({self.room_name})"
