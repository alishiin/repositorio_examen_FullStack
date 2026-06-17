from rest_framework import serializers
from geo_app.models import Location, GeoZone, GeoCache


class LocationSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Location."""
    
    class Meta:
        model = Location
        fields = [
            'id', 'reporte_id', 'pet_id', 'usuario_id',
            'latitud', 'longitud', 'titulo', 'descripcion',
            'tipo_reporte', 'tipo_animal', 'raza_probable',
            'color', 'tamaño', 'imagen_url', 'estado',
            'fecha_reporte', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_actualizacion']
    
    def validate(self, data):
        """Validar coordenadas WGS84."""
        if 'latitud' in data:
            if not (-90 <= data['latitud'] <= 90):
                raise serializers.ValidationError("Latitud debe estar entre -90 y 90")
        if 'longitud' in data:
            if not (-180 <= data['longitud'] <= 180):
                raise serializers.ValidationError("Longitud debe estar entre -180 y 180")
        return data


class GeoZoneSerializer(serializers.ModelSerializer):
    """Serializer para el modelo GeoZone."""
    
    class Meta:
        model = GeoZone
        fields = [
            'id', 'nombre', 'descripcion',
            'latitud_centro', 'longitud_centro', 'radio_km',
            'zona_tipo', 'activa', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class GeoCacheSerializer(serializers.ModelSerializer):
    """Serializer para el modelo GeoCache."""
    
    class Meta:
        model = GeoCache
        fields = [
            'id', 'latitud', 'longitud', 'radio_km',
            'reportes_cercanos', 'fecha_cache', 'valido'
        ]
        read_only_fields = ['id', 'fecha_cache']


class ProximitySearchSerializer(serializers.Serializer):
    """Serializer para solicitudes de búsqueda por proximidad."""
    
    latitud = serializers.FloatField(
        min_value=-90, max_value=90,
        help_text="Latitud del punto de búsqueda"
    )
    longitud = serializers.FloatField(
        min_value=-180, max_value=180,
        help_text="Longitud del punto de búsqueda"
    )
    radio_km = serializers.FloatField(
        default=10, min_value=0.1, max_value=500,
        help_text="Radio de búsqueda en kilómetros"
    )
    tipo_reporte = serializers.ChoiceField(
        choices=['perdido', 'encontrado', 'ambos'],
        default='ambos',
        required=False
    )
    limite = serializers.IntegerField(
        default=50, min_value=1, max_value=1000,
        help_text="Máximo número de resultados"
    )
