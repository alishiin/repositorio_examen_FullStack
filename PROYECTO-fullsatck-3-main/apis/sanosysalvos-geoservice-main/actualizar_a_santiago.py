#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geo_service.settings')
django.setup()

from geo_app.models import Location

# Coordinadas de Santiago, Chile
ubicaciones_santiago = {
    'Providencia': (-33.4269, -70.4103),
    'Estacion Central': (-33.4428, -70.6761),
    'Quinta Normal': (-33.4408, -70.6903)
}

# Actualizar registros existentes a Santiago
perro1 = Location.objects.get(id=1)
perro1.latitud, perro1.longitud = ubicaciones_santiago['Providencia']
perro1.titulo = 'Beagle perdido en Providencia, Santiago'
perro1.save()
print("Actualizado: " + perro1.titulo + " (ID: " + str(perro1.id) + ")")

perro2 = Location.objects.get(id=3)
perro2.latitud, perro2.longitud = ubicaciones_santiago['Estacion Central']
perro2.titulo = 'Labrador dorado perdido en Estacion Central, Santiago'
perro2.save()
print("Actualizado: " + perro2.titulo + " (ID: " + str(perro2.id) + ")")

# Crear tercer perro en Quinta Normal
perro3 = Location.objects.create(
    reporte_id='REP-BOXER-004',
    pet_id='PET-BOXER-004',
    usuario_id='USER-SOFIA-004',
    titulo='Boxer perdido en Quinta Normal, Santiago',
    descripcion='Perro mediano, color brindle, collar marron',
    latitud=ubicaciones_santiago['Quinta Normal'][0],
    longitud=ubicaciones_santiago['Quinta Normal'][1],
    tipo_animal='perro',
    raza_probable='Boxer',
    color='Brindle',
    tamaño='mediano',
    tipo_reporte='perdido'
)
print("Creado: " + perro3.titulo + " (ID: " + str(perro3.id) + ")")
print("\nAhora tienes estos perros con IDs numericas:")
perros = Location.objects.filter(tipo_animal='perro').values('id', 'titulo', 'latitud', 'longitud')
for perro in perros:
    print("  GET /api/ubicaciones/" + str(perro['id']) + "/ - " + perro['titulo'])
