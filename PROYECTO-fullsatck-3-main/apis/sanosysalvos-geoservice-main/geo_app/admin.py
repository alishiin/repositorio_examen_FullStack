from django.contrib import admin
from geo_app.models import Location, GeoZone, GeoCache


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo_reporte', 'tipo_animal', 'latitud', 'longitud', 'fecha_reporte']
    list_filter = ['tipo_reporte', 'tipo_animal', 'fecha_reporte']
    search_fields = ['titulo', 'descripcion', 'raza_probable']
    readonly_fields = ['fecha_reporte', 'fecha_actualizacion', 'reporte_id']


@admin.register(GeoZone)
class GeoZoneAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'zona_tipo', 'radio_km', 'activa']
    list_filter = ['zona_tipo', 'activa']
    search_fields = ['nombre']


@admin.register(GeoCache)
class GeoCacheAdmin(admin.ModelAdmin):
    list_display = ['latitud', 'longitud', 'radio_km', 'valido', 'fecha_cache']
    list_filter = ['valido', 'fecha_cache']
    readonly_fields = ['fecha_cache']
