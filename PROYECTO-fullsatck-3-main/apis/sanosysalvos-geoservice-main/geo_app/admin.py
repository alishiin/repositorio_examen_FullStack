from django.contrib import admin

from geo_app.models import GeoCache, GeoZone, Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = (
        'reporte_id',
        'titulo',
        'tipo_reporte',
        'tipo_animal',
        'estado',
        'fecha_reporte',
    )
    list_filter = ('estado', 'tipo_reporte', 'tipo_animal', 'fecha_reporte')
    list_editable = ('estado',)
    search_fields = ('reporte_id', 'titulo', 'descripcion', 'raza_probable')
    readonly_fields = ('fecha_reporte', 'fecha_actualizacion')
    list_per_page = 30
    ordering = ('-fecha_reporte',)

    fieldsets = (
        ('Identificacion', {
            'fields': ('reporte_id', 'pet_id', 'usuario_id'),
        }),
        ('Datos del reporte', {
            'fields': ('titulo', 'descripcion', 'tipo_reporte', 'estado'),
        }),
        ('Mascota', {
            'fields': ('tipo_animal', 'raza_probable', 'color', 'tamaño'),
        }),
        ('Ubicacion', {
            'fields': ('latitud', 'longitud'),
        }),
        ('Multimedia', {
            'fields': ('imagen_url',),
            'classes': ('collapse',),
        }),
        ('Auditoria', {
            'fields': ('fecha_reporte', 'fecha_actualizacion'),
            'classes': ('collapse',),
        }),
    )


@admin.register(GeoZone)
class GeoZoneAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'zona_tipo', 'radio_km', 'activa')
    list_filter = ('zona_tipo', 'activa')
    search_fields = ('nombre',)


@admin.register(GeoCache)
class GeoCacheAdmin(admin.ModelAdmin):
    list_display = ('latitud', 'longitud', 'radio_km', 'valido', 'fecha_cache')
    list_filter = ('valido', 'fecha_cache')
    readonly_fields = ('fecha_cache',)
