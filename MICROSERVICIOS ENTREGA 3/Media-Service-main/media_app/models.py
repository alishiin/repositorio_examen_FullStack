import uuid
from django.db import models

class PetImage(models.Model):
    # Identificador único global de la imagen
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Campo para almacenar físicamente la foto de la mascota
    image = models.ImageField(upload_to='pets_uploaded/') 
    
    # Registro temporal automático
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # ID de referencia de la mascota en el 'Pet Service' (para mantener el desacoplamiento)
    pet_id = models.CharField(max_length=255, blank=True, null=True) 

    def __str__(self):
        return f"Imagen {self.id} - Mascota Ref: {self.pet_id}"