from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Location(models.Model):
    """
    Modelo para almacenar ubicaciones geográficas de reportes de mascotas.
    
    RESPONSABILIDADES:
    ✅ Almacenar coordenadas geográficas
    ✅ Filtrar por proximidad y radio
    ✅ Proporcionar datos mínimos para matching
    ✅ Cacheado de búsquedas frecuentes
    
    REFERENCIAS (No son propietarios):
    - reporte_id → Pet Service (dueño de reportes)
    - pet_id → Pet Service (dueño de mascotas)
    - usuario_id → Auth Service (dueño de usuarios)
    """
    TIPO_REPORTE_CHOICES = [
        ('perdido', 'Perdido'),
        ('encontrado', 'Encontrado'),
    ]
    
    TIPO_ANIMAL_CHOICES = [
        ('perro', 'Perro'),
        ('gato', 'Gato'),
        ('pajaro', 'Pájaro'),
        ('conejo', 'Conejo'),
        ('otro', 'Otro'),
    ]
    
    TAMAÑO_CHOICES = [
        ('pequeño', 'Pequeño (0-10 kg)'),
        ('mediano', 'Mediano (10-30 kg)'),
        ('grande', 'Grande (30-50 kg)'),
        ('muy_grande', 'Muy Grande (50+ kg)'),
    ]

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('resuelto', 'Resuelto'),
        ('cerrado', 'Cerrado'),
    ]
    
    # Identificadores (referencias a otros servicios)
    id = models.AutoField(primary_key=True)
    reporte_id = models.CharField(
        max_length=100, 
        unique=True, 
        db_index=True,
        help_text="ID único del reporte (Pet Service)"
    )
    pet_id = models.CharField(
        max_length=100, 
        db_index=True,
        help_text="ID de la mascota (Pet Service)"
    )
    usuario_id = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_index=True,
        help_text="UUID del usuario que creó el reporte (Auth Service)"
    )
    
    # Ubicación (DATOS PRIMARIOS)
    latitud = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text="Latitud en WGS84"
    )
    longitud = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text="Longitud en WGS84"
    )
    
    # Información mínima del reporte (cacheada de Pet Service)
    titulo = models.CharField(max_length=255, blank=True)
    descripcion = models.TextField(blank=True)
    tipo_reporte = models.CharField(
        max_length=20,
        choices=TIPO_REPORTE_CHOICES,
        db_index=True,
        help_text="Tipo de reporte: perdido o encontrado"
    )
    
    # Información mínima de la mascota (para filtering y matching)
    tipo_animal = models.CharField(
        max_length=50,
        choices=TIPO_ANIMAL_CHOICES,
        blank=True,
        help_text="Tipo de animal para matching"
    )
    raza_probable = models.CharField(
        max_length=100,
        blank=True,
        help_text="Raza probable para matching"
    )
    color = models.CharField(
        max_length=100,
        blank=True,
        help_text="Color para matching"
    )
    tamaño = models.CharField(
        max_length=20,
        choices=TAMAÑO_CHOICES,
        blank=True,
        help_text="Tamaño para matching"
    )
    imagen_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL de la imagen del reporte (Media Service)"
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo',
        db_index=True,
        help_text="Estado del reporte: activo (vigente), resuelto (mascota encontrada/devuelta), cerrado"
    )
    
    # Timestamps
    fecha_reporte = models.DateTimeField(
        default=timezone.now,
        help_text="Fecha del reporte original"
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        ordering = ['-fecha_reporte']
        indexes = [
            models.Index(fields=['latitud', 'longitud'], name='location_idx'),
            models.Index(fields=['reporte_id'], name='reporte_id_idx'),
            models.Index(fields=['tipo_reporte'], name='tipo_reporte_idx'),
            models.Index(fields=['usuario_id'], name='usuario_id_idx'),
        ]
    
    def __str__(self):
        return f"{self.titulo} ({self.tipo_reporte}) @ ({self.latitud:.4f}, {self.longitud:.4f})"


class GeoZone(models.Model):
    """
    Modelo para definir zonas geográficas de búsqueda.
    """
    nombre = models.CharField(max_length=200, unique=True)
    descripcion = models.TextField(blank=True)
    
    # Centro de la zona
    latitud_centro = models.FloatField(validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitud_centro = models.FloatField(validators=[MinValueValidator(-180), MaxValueValidator(180)])
    
    # Radio de la zona (en km)
    radio_km = models.FloatField(default=5, validators=[MinValueValidator(0.1)])
    
    # Tipo de zona
    zona_tipo = models.CharField(
        max_length=50,
        choices=[
            ('barrio', 'Barrio'),
            ('ciudad', 'Ciudad'),
            ('region', 'Región'),
            ('personalizada', 'Personalizada')
        ],
        default='personalizada'
    )
    
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class GeoCache(models.Model):
    """
    Caché para consultas geográficas frecuentes.
    """
    latitud = models.FloatField()
    longitud = models.FloatField()
    radio_km = models.FloatField()
    
    # Datos en caché (JSON)
    reportes_cercanos = models.TextField(blank=True)  # JSONField alternativo
    
    # Control de validez
    fecha_cache = models.DateTimeField(auto_now=True)
    valido = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('latitud', 'longitud', 'radio_km')
        ordering = ['-fecha_cache']
    
    def __str__(self):
        return f"Cache ({self.latitud}, {self.longitud}) radio {self.radio_km}km"
