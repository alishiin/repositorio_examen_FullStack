from django.contrib.auth.models import AbstractUser
from django.db import models
from .validators import validate_chilean_rut, validate_chilean_phone


class User(AbstractUser):
    # Campos base
    email = models.EmailField(unique=True)
    
    # Datos personales chilenos
    full_name = models.CharField(max_length=255, blank=False)
    rut = models.CharField(
        max_length=12,
        unique=True,
        validators=[validate_chilean_rut],
        help_text="Formato: 12345678-9 o 12.345.678-9"
    )
    phone = models.CharField(
        max_length=20,
        validators=[validate_chilean_phone],
        help_text="Formato: 9 XXXX XXXX o +56 9 XXXX XXXX"
    )
    commune = models.CharField(max_length=100, blank=False)
    address = models.TextField(blank=False)
    
    class Meta:
        db_table = 'users_user'
    
    def __str__(self):
        return f"{self.full_name} ({self.rut})"