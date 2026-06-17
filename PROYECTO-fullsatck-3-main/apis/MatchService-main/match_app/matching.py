"""Logica pura de scoring de coincidencias entre reportes de mascotas.

Sin IA, sin DB, sin HTTP. Solo metadata: tipo de animal, raza, color,
tamano, distancia geografica (Haversine) y cercania temporal.

Pesos (suma maxima = 100):
    Tipo animal coincide:       obligatorio (corte temprano si no)
    Misma raza:                 25 pts
    Mismo color exacto:         15 pts | color similar (palabras comunes): 8 pts
    Mismo tamano:               10 pts
    Distancia <=10 km:          hasta 20 pts (lineal)
    Fecha <=30 dias:            hasta 15 pts (lineal)
"""
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from typing import Tuple


EARTH_RADIUS_KM = 6371
DIST_MAX_KM = 10
DIST_MAX_PTS = 20
DAYS_MAX = 30
DAYS_MAX_PTS = 15


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    """Distancia geodesica entre dos puntos (km)."""
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(sqrt(a))


def _parse_fecha(value):
    """Acepta datetime, ISO string o YYYY-MM-DD. None si no parsea."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if not isinstance(value, str):
        return None
    # (formato, longitud_esperada_del_input)
    candidatos = (
        ('%Y-%m-%dT%H:%M:%S.%fZ', 24),
        ('%Y-%m-%dT%H:%M:%S', 19),
        ('%Y-%m-%d', 10),
    )
    for fmt, n in candidatos:
        try:
            return datetime.strptime(value[:n], fmt)
        except ValueError:
            continue
    return None


def _get_tamano(reporte: dict) -> str:
    """Acepta tamano o tamano (con n con tilde) por compat con el frontend."""
    return (reporte.get('tamano') or reporte.get('tamaño') or '').lower().strip()


def calcular_score(origen: dict, candidato: dict) -> Tuple[float, list]:
    """Devuelve (score, reasons). Si tipo_animal no coincide -> (0.0, [])."""
    tipo_o = (origen.get('tipo_animal') or '').lower().strip()
    tipo_c = (candidato.get('tipo_animal') or '').lower().strip()
    if not tipo_o or tipo_o != tipo_c:
        return 0.0, []

    reasons = ['mismo_tipo_animal']
    score = 0.0

    # Raza (case-insensitive, exact match)
    raza_o = (origen.get('raza_probable') or '').lower().strip()
    raza_c = (candidato.get('raza_probable') or '').lower().strip()
    if raza_o and raza_c and raza_o == raza_c:
        score += 25
        reasons.append('misma_raza')

    # Color (set de palabras: total match = 15, interseccion = 8)
    color_o = set((origen.get('color') or '').lower().split())
    color_c = set((candidato.get('color') or '').lower().split())
    if color_o and color_c:
        if color_o == color_c:
            score += 15
            reasons.append('mismo_color')
        elif color_o & color_c:
            score += 8
            reasons.append('color_similar')

    # Tamano
    tam_o = _get_tamano(origen)
    tam_c = _get_tamano(candidato)
    if tam_o and tam_c and tam_o == tam_c:
        score += 10
        reasons.append('mismo_tamano')

    # Distancia geografica (lineal: 0km=20pts, 10km=0pts)
    try:
        lat_o = float(origen.get('latitud'))
        lng_o = float(origen.get('longitud'))
        lat_c = float(candidato.get('latitud'))
        lng_c = float(candidato.get('longitud'))
        dist = haversine_km(lat_o, lng_o, lat_c, lng_c)
        if dist <= DIST_MAX_KM:
            score += DIST_MAX_PTS * (1 - dist / DIST_MAX_KM)
            reasons.append('zona_muy_cercana' if dist <= 2 else 'zona_cercana')
    except (TypeError, ValueError):
        pass

    # Cercania temporal (lineal: 0d=15pts, 30d=0pts)
    fecha_o = _parse_fecha(origen.get('fecha_reporte'))
    fecha_c = _parse_fecha(candidato.get('fecha_reporte'))
    if fecha_o and fecha_c:
        dias = abs((fecha_o - fecha_c).days)
        if dias <= DAYS_MAX:
            score += DAYS_MAX_PTS * (1 - dias / DAYS_MAX)
            reasons.append('fecha_muy_cercana' if dias <= 7 else 'fecha_cercana')

    return round(min(score, 100.0), 1), reasons
