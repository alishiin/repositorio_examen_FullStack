"""
Tests de serializers para validación de datos.

Valida:
- LocationSerializer
- GeoZoneSerializer  
- ProximitySearchSerializer
"""

from django.test import TestCase
from django.utils import timezone

from geo_app.serializers import (
    LocationSerializer,
    ProximitySearchSerializer
)


class LocationSerializerTestCase(TestCase):
    """Suite de tests para LocationSerializer."""

    def test_serializer_valido(self):
        """✅ Test: Serializer con datos válidos."""
        data = {
            'reporte_id': 'REP-123',
            'pet_id': 'PET-456',
            'titulo': 'Gato perdido',
            'latitud': 4.7110,
            'longitud': -74.0721,
            'tipo_reporte': 'perdido',
            'tipo_animal': 'gato',
            'color': 'Naranja',
            'fecha_reporte': timezone.now(),
        }
        serializer = LocationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_latitud_fuera_rango(self):
        """❌ Test: Rechazar latitud inválida en serializer."""
        data = {
            'reporte_id': 'REP-123',
            'pet_id': 'PET-456',
            'latitud': 95,  # Inválido
            'longitud': -74.0721,
            'tipo_reporte': 'perdido',
            'fecha_reporte': timezone.now(),
        }
        serializer = LocationSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_longitud_fuera_rango(self):
        """❌ Test: Rechazar longitud inválida en serializer."""
        data = {
            'reporte_id': 'REP-123',
            'pet_id': 'PET-456',
            'latitud': 4.7110,
            'longitud': 200,  # Inválido
            'tipo_reporte': 'perdido',
            'fecha_reporte': timezone.now(),
        }
        serializer = LocationSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class ProximitySearchSerializerTestCase(TestCase):
    """Suite de tests para ProximitySearchSerializer."""

    def test_search_data_valida(self):
        """✅ Test: Datos válidos para búsqueda de proximidad."""
        data = {
            'latitud': 4.7110,
            'longitud': -74.0721,
            'radio_km': 10,
            'tipo_reporte': 'perdido',
            'limite': 50,
        }
        serializer = ProximitySearchSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_radio_minimo(self):
        """❌ Test: Rechazar radio < 0.1 km."""
        data = {
            'latitud': 4.7110,
            'longitud': -74.0721,
            'radio_km': 0.05,
        }
        serializer = ProximitySearchSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_radio_maximo(self):
        """❌ Test: Rechazar radio > 500 km."""
        data = {
            'latitud': 4.7110,
            'longitud': -74.0721,
            'radio_km': 999,
        }
        serializer = ProximitySearchSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_defaults_aplicados(self):
        """✅ Test: Defaults se aplican correctamente."""
        data = {
            'latitud': 4.7110,
            'longitud': -74.0721,
        }
        serializer = ProximitySearchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['radio_km'], 10)
        self.assertEqual(serializer.validated_data['tipo_reporte'], 'ambos')
        self.assertEqual(serializer.validated_data['limite'], 50)
