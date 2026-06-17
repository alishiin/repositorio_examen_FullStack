"""Clientes HTTP delgaditos a otros microservicios.

Mantenidos como funciones (no clases) para que sean trivialmente
mockeables en tests con @patch('match_app.clients.func').
"""
import os

import requests


GEO_SERVICE_URL = os.environ.get('GEO_SERVICE_URL', 'http://localhost:8003')
NOTIFICATION_SERVICE_URL = os.environ.get(
    'NOTIFICATION_SERVICE_URL', 'http://localhost:8007'
)


def listar_reportes_opuestos(tipo_actual: str, timeout: int = 5) -> list:
    """Devuelve la lista de reportes del tipo opuesto (perdido<->encontrado).

    Si el GeoService falla, devuelve lista vacia (degradacion suave).
    """
    tipo_actual = (tipo_actual or '').lower()
    if tipo_actual not in ('perdido', 'encontrado'):
        return []
    tipo_opuesto = 'encontrado' if tipo_actual == 'perdido' else 'perdido'

    try:
        resp = requests.get(
            f'{GEO_SERVICE_URL}/api/ubicaciones/',
            params={'tipo_reporte': tipo_opuesto},
            timeout=timeout,
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        if isinstance(data, dict) and isinstance(data.get('results'), list):
            return data['results']
        if isinstance(data, list):
            return data
        return []
    except Exception as e:
        print(f'[clients.listar_reportes_opuestos] {e}')
        return []


def disparar_notificacion(
    user_id, match_id: int, pet_name: str, score: float, timeout: int = 5
) -> bool:
    """Llama al NotificationService /trigger-match/. False si falla."""
    if not user_id:
        return False
    try:
        resp = requests.post(
            f'{NOTIFICATION_SERVICE_URL}/api/notifications/trigger-match/',
            json={
                'user_id': user_id,
                'user_email': '',
                'match_id': match_id,
                'pet_name': pet_name,
                'message': f'Posible coincidencia detectada (score: {score})',
            },
            timeout=timeout,
        )
        return resp.status_code in (200, 201)
    except Exception as e:
        print(f'[clients.disparar_notificacion] {e}')
        return False
