#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geo_service.settings')
django.setup()

from geo_app.models import Location
from datetime import datetime, timezone

# Limpiar datos previos (opcional)
Location.objects.all().delete()

# Crear ubicaciones de prueba
ubicaciones = [
    {
        'reporte_id': 'REP-PERRO-001',
        'pet_id': 'PET-BEAGLE-001',
        'usuario_id': 'USER-JUAN-001',
        'titulo': 'Beagle perdido en Chapinero',
        'descripcion': 'Perro pequeno, collar rojo, sin microchip. Desaparecio el 5 de mayo',
        'latitud': 4.7169,
        'longitud': -74.0433,
        'tipo_animal': 'perro',
        'raza_probable': 'Beagle',
        'color': 'Tricolor',
        'tamaño': 'pequeno',
        'tipo_reporte': 'perdido',
        'fecha_reporte': datetime(2026, 5, 5, 14, 30, 0, tzinfo=timezone.utc)
    },
    {
        'reporte_id': 'REP-GATO-002',
        'pet_id': 'PET-SIAMES-002',
        'usuario_id': 'USER-MARIA-002',
        'titulo': 'Gato siames encontrado en Usaquen',
        'descripcion': 'Gato de color claro con orejas oscuras, collar de campanas',
        'latitud': 4.7200,
        'longitud': -74.0380,
        'tipo_animal': 'gato',
        'raza_probable': 'Siames',
        'color': 'Crema y Seal',
        'tamaño': 'mediano',
        'tipo_reporte': 'encontrado',
        'fecha_reporte': datetime(2026, 5, 8, 9, 0, 0, tzinfo=timezone.utc)
    },
    {
        'reporte_id': 'REP-LABRADOR-003',
        'pet_id': 'PET-LABRADOR-003',
        'usuario_id': 'USER-CARLOS-003',
        'titulo': 'Labrador dorado perdido en Teusaquillo',
        'descripcion': 'Perro grande, muy amigable, lleva collar azul con timbre',
        'latitud': 4.7143,
        'longitud': -74.0450,
        'tipo_animal': 'perro',
        'raza_probable': 'Labrador',
        'color': 'Dorado',
        'tamaño': 'grande',
        'tipo_reporte': 'perdido',
        'fecha_reporte': datetime(2026, 5, 7, 16, 45, 0, tzinfo=timezone.utc)
    }
]

# Crear los registros
for data in ubicaciones:
    ubicacion = Location.objects.create(**data)
    print("Creado: " + ubicacion.titulo + " (ID: " + str(ubicacion.id) + ")")

print("\nTotal de ubicaciones creadas: " + str(Location.objects.count()))
