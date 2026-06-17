from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from math import radians, cos, sin, asin, sqrt
from django.db.models import Q
from geo_app.models import Location, GeoZone, GeoCache
from geo_app.serializers import (
    LocationSerializer, GeoZoneSerializer,
    GeoCacheSerializer, ProximitySearchSerializer
)
import logging
import json

logger = logging.getLogger(__name__)


def calcular_distancia(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia en km entre dos puntos usando la fórmula de Haversine.
    
    Args:
        lat1, lon1: Punto 1 (latitud, longitud)
        lat2, lon2: Punto 2 (latitud, longitud)
    
    Returns:
        float: Distancia en kilómetros
    """
    # Convertir grados a radianes
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Fórmula de Haversine
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radio de la Tierra en km
    
    return c * r


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar ubicaciones geográficas de reportes.
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['tipo_reporte', 'tipo_animal']
    search_fields = ['titulo', 'descripcion', 'raza_probable']
    ordering_fields = ['fecha_reporte', 'titulo']
    ordering = ['-fecha_reporte']
    
    def get_queryset(self):
        queryset = Location.objects.all()
        
        # Filtrar por tipo de animal
        tipo_animal = self.request.query_params.get('tipo_animal')
        if tipo_animal:
            queryset = queryset.filter(tipo_animal__icontains=tipo_animal)
        
        # Filtrar por raza
        raza = self.request.query_params.get('raza')
        if raza:
            queryset = queryset.filter(raza_probable__icontains=raza)
        
        # Filtrar por color
        color = self.request.query_params.get('color')
        if color:
            queryset = queryset.filter(color__icontains=color)
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def buscar_cercanos(self, request):
        """
        Busca reportes cercanos a una ubicación específica.
        
        Request:
        {
            "latitud": 4.7110,
            "longitud": -74.0721,
            "radio_km": 10,
            "tipo_reporte": "ambos" (perdido/encontrado/ambos)
        }
        """
        serializer = ProximitySearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        lat = serializer.validated_data['latitud']
        lon = serializer.validated_data['longitud']
        radio = serializer.validated_data['radio_km']
        tipo_reporte = serializer.validated_data.get('tipo_reporte', 'ambos')
        limite = serializer.validated_data.get('limite', 50)
        
        # Obtener todos los reportes
        reportes = Location.objects.all()
        
        # Filtrar por tipo si es necesario
        if tipo_reporte != 'ambos':
            reportes = reportes.filter(tipo_reporte=tipo_reporte)
        
        # Calcular distancias y filtrar
        reportes_cercanos = []
        for reporte in reportes:
            distancia = calcular_distancia(lat, lon, reporte.latitud, reporte.longitud)
            if distancia <= radio:
                reporte_data = LocationSerializer(reporte).data
                reporte_data['distancia_km'] = round(distancia, 2)
                reportes_cercanos.append(reporte_data)
        
        # Ordenar por distancia
        reportes_cercanos.sort(key=lambda x: x['distancia_km'])
        
        # Limitar resultados
        reportes_cercanos = reportes_cercanos[:limite]
        
        logger.info(
            f"Búsqueda de proximidad: lat={lat}, lon={lon}, "
            f"radio={radio}km, encontrados={len(reportes_cercanos)}"
        )
        
        return Response({
            'punto_busqueda': {
                'latitud': lat,
                'longitud': lon
            },
            'radio_km': radio,
            'tipo_reporte': tipo_reporte,
            'total_encontrados': len(reportes_cercanos),
            'reportes': reportes_cercanos
        })
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def obtener_cercanos(self, request, pk=None):
        """
        Obtiene todos los reportes cercanos a un reporte específico.
        """
        try:
            reporte = Location.objects.get(pk=pk)
        except Location.DoesNotExist:
            return Response({'error': 'Reporte no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        radio_km = float(request.query_params.get('radio', 10))
        tipo_opuesto = 'encontrado' if reporte.tipo_reporte == 'perdido' else 'perdido'
        
        # Buscar reportes del tipo opuesto cerca
        todos_reportes = Location.objects.filter(tipo_reporte=tipo_opuesto)
        
        reportes_cercanos = []
        for otro_reporte in todos_reportes:
            distancia = calcular_distancia(
                reporte.latitud, reporte.longitud,
                otro_reporte.latitud, otro_reporte.longitud
            )
            if distancia <= radio_km:
                reporte_data = LocationSerializer(otro_reporte).data
                reporte_data['distancia_km'] = round(distancia, 2)
                reportes_cercanos.append(reporte_data)
        
        # Ordenar por distancia
        reportes_cercanos.sort(key=lambda x: x['distancia_km'])
        
        return Response({
            'reporte_principal': LocationSerializer(reporte).data,
            'tipo_busqueda': tipo_opuesto,
            'radio_km': radio_km,
            'coincidencias': reportes_cercanos,
            'total': len(reportes_cercanos)
        })
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def stats_geografico(self, request):
        """
        Obtiene estadísticas geográficas.
        """
        reportes_totales = Location.objects.count()
        perdidos = Location.objects.filter(tipo_reporte='perdido').count()
        encontrados = Location.objects.filter(tipo_reporte='encontrado').count()
        
        # Tipo de animal más reportado
        from django.db.models import Count
        tipo_mas_reportado = Location.objects.values('tipo_animal').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad').first()
        
        return Response({
            'total_reportes': reportes_totales,
            'perdidos': perdidos,
            'encontrados': encontrados,
            'tipo_animal_mas_reportado': tipo_mas_reportado
        })


class GeoZoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar zonas geográficas.
    """
    queryset = GeoZone.objects.all()
    serializer_class = GeoZoneSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['zona_tipo', 'activa']
    search_fields = ['nombre', 'descripcion']
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reportes_en_zona(self, request, pk=None):
        """
        Obtiene todos los reportes dentro de una zona específica.
        """
        try:
            zona = GeoZone.objects.get(pk=pk)
        except GeoZone.DoesNotExist:
            return Response({'error': 'Zona no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        # Buscar reportes dentro de la zona
        todos_reportes = Location.objects.all()
        
        reportes_en_zona = []
        for reporte in todos_reportes:
            distancia = calcular_distancia(
                zona.latitud_centro, zona.longitud_centro,
                reporte.latitud, reporte.longitud
            )
            if distancia <= zona.radio_km:
                reporte_data = LocationSerializer(reporte).data
                reporte_data['distancia_km'] = round(distancia, 2)
                reportes_en_zona.append(reporte_data)
        
        return Response({
            'zona': GeoZoneSerializer(zona).data,
            'reportes_encontrados': len(reportes_en_zona),
            'reportes': reportes_en_zona
        })
