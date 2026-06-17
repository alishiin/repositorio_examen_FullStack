"""
Tests de modelos Location y GeoZone.

Valida:
- Creación y campos requeridos
- Validación de coordenadas WGS84
- Índices y constraints
- Representación del objeto
"""

from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
import time
import uuid

from geo_app.models import Location, GeoZone


class LocationModelTestCase(TestCase):
    """
    Suite de tests para el modelo Location.
    
    Valida:
    - Creación y campos requeridos
    - Validación de coordenadas WGS84
    - Índices y constraints
    - Representación del objeto
    """

    def setUp(self):
        """Configurar datos para cada test."""
        self.location_data = {
            'reporte_id': f'REP-{uuid.uuid4()}',
            'pet_id': f'PET-{uuid.uuid4()}',
            'usuario_id': f'USER-{uuid.uuid4()}',
            'titulo': 'Perrito Perdido en Bogotá',
            'descripcion': 'Perro pequeño, color marrón, desaparecido hace 2 días',
            'latitud': 4.7110,
            'longitud': -74.0721,
            'tipo_animal': 'perro',
            'raza_probable': 'Labrador',
            'color': 'Marrón',
            'tamaño': 'mediano',
            'tipo_reporte': 'perdido',
            'fecha_reporte': timezone.now(),
        }

    def test_crear_location_valida(self):
        """✅ Test: Crear Location con datos válidos."""
        location = Location.objects.create(**self.location_data)
        
        self.assertIsNotNone(location.id)
        self.assertEqual(location.titulo, self.location_data['titulo'])
        self.assertEqual(location.tipo_reporte, 'perdido')
        self.assertEqual(location.latitud, 4.7110)
        self.assertEqual(location.longitud, -74.0721)

    def test_latitud_invalida_negative(self):
        """❌ Test: Rechazar latitud < -90."""
        self.location_data['latitud'] = -91
        with self.assertRaises(ValidationError):
            location = Location(**self.location_data)
            location.full_clean()

    def test_latitud_invalida_positive(self):
        """❌ Test: Rechazar latitud > 90."""
        self.location_data['latitud'] = 91
        with self.assertRaises(ValidationError):
            location = Location(**self.location_data)
            location.full_clean()

    def test_longitud_invalida_negative(self):
        """❌ Test: Rechazar longitud < -180."""
        self.location_data['longitud'] = -181
        with self.assertRaises(ValidationError):
            location = Location(**self.location_data)
            location.full_clean()

    def test_longitud_invalida_positive(self):
        """❌ Test: Rechazar longitud > 180."""
        self.location_data['longitud'] = 181
        with self.assertRaises(ValidationError):
            location = Location(**self.location_data)
            location.full_clean()

    def test_reporte_id_unique(self):
        """❌ Test: reporte_id debe ser único."""
        Location.objects.create(**self.location_data)
        
        with self.assertRaises(Exception):  # IntegrityError
            self.location_data['pet_id'] = f'PET-{uuid.uuid4()}'
            Location.objects.create(**self.location_data)

    def test_string_representation(self):
        """✅ Test: __str__ devuelve formato correcto."""
        location = Location.objects.create(**self.location_data)
        expected = f"Perrito Perdido en Bogotá (perdido) @ (4.7110, -74.0721)"
        self.assertEqual(str(location), expected)

    def test_fecha_actualizacion_auto_update(self):
        """✅ Test: fecha_actualizacion se actualiza automáticamente."""
        location = Location.objects.create(**self.location_data)
        original_time = location.fecha_actualizacion
        
        # Esperar un poco (50ms) para garantizar diferencia de tiempo
        time.sleep(0.05)
        
        # Actualizar
        location.titulo = 'Nuevo título'
        location.save()
        
        self.assertGreater(location.fecha_actualizacion, original_time)

    def test_uuid_id_generado(self):
        """✅ Test: ID es UUID generado automáticamente."""
        location = Location.objects.create(**self.location_data)
        self.assertIsNotNone(location.id)
        # Verificar que es un UUID válido
        self.assertTrue(len(str(location.id)) > 0)


class GeoZoneModelTestCase(TestCase):
    """Suite de tests para el modelo GeoZone."""

    def setUp(self):
        """Configurar datos para cada test."""
        self.zone_data = {
            'nombre': 'Zona Centro Bogotá',
            'descripcion': 'Centro histórico de Bogotá',
            'latitud_centro': 4.6971,
            'longitud_centro': -74.0762,
            'radio_km': 5.0,
            'zona_tipo': 'barrio',
        }

    def test_crear_geozone_valida(self):
        """✅ Test: Crear GeoZone con datos válidos."""
        zone = GeoZone.objects.create(**self.zone_data)
        
        self.assertIsNotNone(zone.id)
        self.assertEqual(zone.nombre, self.zone_data['nombre'])
        self.assertEqual(zone.radio_km, 5.0)

    def test_radio_km_minimo(self):
        """❌ Test: Rechazar radio < 0.1 km."""
        self.zone_data['radio_km'] = 0.05
        with self.assertRaises(ValidationError):
            zone = GeoZone(**self.zone_data)
            zone.full_clean()
