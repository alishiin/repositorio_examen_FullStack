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

# Obtener los 2 perros
perros = Location.objects.filter(tipo_animal='perro')

if perros.count() >= 2:
    perro1 = perros[0]
    perro2 = perros[1]
    
    # Actualizar Beagle a Providencia
    perro1.latitud, perro1.longitud = ubicaciones_santiago['Providencia']
    perro1.titulo = 'Beagle perdido en Providencia, Santiago'
    perro1.save()
    print("Actualizado: " + perro1.titulo)
    print("  Coordenadas: " + str(perro1.latitud) + ", " + str(perro1.longitud))
    
    # Actualizar Labrador a Estacion Central
    perro2.latitud, perro2.longitud = ubicaciones_santiago['Estacion Central']
    perro2.titulo = 'Labrador dorado perdido en Estacion Central, Santiago'
    perro2.save()
    print("Actualizado: " + perro2.titulo)
    print("  Coordenadas: " + str(perro2.latitud) + ", " + str(perro2.longitud))
    
    # Crear un tercer perro en Quinta Normal
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
    print("Creado: " + perro3.titulo)
    print("  Coordenadas: " + str(perro3.latitud) + ", " + str(perro3.longitud))
else:
    print("No hay suficientes perros para actualizar")
