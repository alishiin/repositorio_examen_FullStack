"""Tests extra para subir cobertura: service_clients + views (FASE 2D.0).

Mockeamos `safe_request` para no llamar APIs reales.
"""
from unittest.mock import patch, MagicMock

import pytest
from rest_framework.test import APIClient

from geo_app.models import Location, GeoZone
from geo_app.service_clients import UserServiceClient, PetServiceClient
from geo_app.circuit_breaker import CircuitBreakerException
from geo_app.views import calcular_distancia


pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def location_factory(db):
    counter = {'i': 0}

    def _make(**overrides):
        counter['i'] += 1
        i = counter['i']
        defaults = {
            'reporte_id': f'rep-{i}',
            'pet_id': f'pet-{i}',
            'usuario_id': f'user-{i}',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'titulo': f'Mascota perdida {i}',
            'descripcion': 'desc',
            'latitud': 4.7110,
            'longitud': -74.0721,
        }
        defaults.update(overrides)
        return Location.objects.create(**defaults)

    return _make


# =====================================================================
# service_clients.py — mockeando safe_request
# =====================================================================

class TestUserServiceClient:
    @patch('geo_app.service_clients.safe_request')
    def test_get_user_by_id_ok(self, mock_req):
        mock_req.return_value = MagicMock(json=lambda: {'id': 'u1', 'name': 'Alice'})
        result = UserServiceClient.get_user_by_id('u1')
        assert result == {'id': 'u1', 'name': 'Alice'}

    @patch('geo_app.service_clients.safe_request', side_effect=CircuitBreakerException('open'))
    def test_get_user_circuit_open(self, _):
        assert UserServiceClient.get_user_by_id('u1') is None

    @patch('geo_app.service_clients.safe_request', side_effect=RuntimeError('boom'))
    def test_get_user_generic_error(self, _):
        assert UserServiceClient.get_user_by_id('u1') is None

    @patch('geo_app.service_clients.safe_request')
    def test_validate_token_ok(self, mock_req):
        mock_req.return_value = MagicMock(json=lambda: {'valid': True})
        assert UserServiceClient.validate_user_token('tk') == {'valid': True}

    @patch('geo_app.service_clients.safe_request', side_effect=CircuitBreakerException('open'))
    def test_validate_token_circuit_open(self, _):
        assert UserServiceClient.validate_user_token('tk') is None

    @patch('geo_app.service_clients.safe_request', side_effect=RuntimeError('x'))
    def test_validate_token_generic_error(self, _):
        assert UserServiceClient.validate_user_token('tk') is None


class TestPetServiceClient:
    @patch('geo_app.service_clients.safe_request')
    def test_get_pet_ok(self, mock_req):
        mock_req.return_value = MagicMock(json=lambda: {'id': 'p1'})
        assert PetServiceClient.get_pet_by_id('p1') == {'id': 'p1'}

    @patch('geo_app.service_clients.safe_request', side_effect=CircuitBreakerException('open'))
    def test_get_pet_circuit_open(self, _):
        assert PetServiceClient.get_pet_by_id('p1') is None

    @patch('geo_app.service_clients.safe_request', side_effect=RuntimeError('x'))
    def test_get_pet_generic_error(self, _):
        assert PetServiceClient.get_pet_by_id('p1') is None

    @patch('geo_app.service_clients.safe_request')
    def test_get_report_ok(self, mock_req):
        mock_req.return_value = MagicMock(json=lambda: {'id': 'r1'})
        assert PetServiceClient.get_report_by_id('r1') == {'id': 'r1'}

    @patch('geo_app.service_clients.safe_request', side_effect=CircuitBreakerException('open'))
    def test_get_report_circuit_open(self, _):
        assert PetServiceClient.get_report_by_id('r1') is None

    @patch('geo_app.service_clients.safe_request', side_effect=RuntimeError('x'))
    def test_get_report_generic_error(self, _):
        assert PetServiceClient.get_report_by_id('r1') is None

    @patch('geo_app.service_clients.safe_request')
    def test_notify_matches_ok(self, mock_req):
        mock_req.return_value = MagicMock(status_code=200)
        assert PetServiceClient.notify_nearby_matches('r1', ['m1']) is True

    @patch('geo_app.service_clients.safe_request')
    def test_notify_matches_http_error(self, mock_req):
        mock_req.return_value = MagicMock(status_code=500)
        assert PetServiceClient.notify_nearby_matches('r1', ['m1']) is False

    @patch('geo_app.service_clients.safe_request', side_effect=CircuitBreakerException('open'))
    def test_notify_matches_circuit_open(self, _):
        assert PetServiceClient.notify_nearby_matches('r1', ['m1']) is False

    @patch('geo_app.service_clients.safe_request', side_effect=RuntimeError('x'))
    def test_notify_matches_generic_error(self, _):
        assert PetServiceClient.notify_nearby_matches('r1', ['m1']) is False


# =====================================================================
# views.py — usando los endpoints reales /api/ubicaciones/
# =====================================================================

class TestCalcularDistancia:
    def test_misma_ubicacion(self):
        assert calcular_distancia(4.71, -74.07, 4.71, -74.07) == pytest.approx(0, abs=0.001)

    def test_distancia_conocida(self):
        # Bogota -> Medellin aprox 240km
        d = calcular_distancia(4.7110, -74.0721, 6.2476, -75.5658)
        assert 230 < d < 260


class TestLocationViewSetList:
    URL = '/api/ubicaciones/'

    def test_list_empty(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 200

    def test_list_returns_seeded(self, api_client, location_factory):
        location_factory(tipo_animal='perro')
        location_factory(tipo_animal='gato')
        resp = api_client.get(self.URL)
        assert resp.status_code == 200
        # Paginado: respuesta tiene 'results'
        results = resp.data.get('results', resp.data)
        assert len(results) == 2

    def test_filter_by_tipo_animal(self, api_client, location_factory):
        location_factory(tipo_animal='perro')
        location_factory(tipo_animal='gato')
        resp = api_client.get(self.URL, {'tipo_animal': 'perro'})
        results = resp.data.get('results', resp.data)
        assert len(results) == 1

    def test_filter_by_raza(self, api_client, location_factory):
        location_factory(raza_probable='labrador')
        location_factory(raza_probable='poodle')
        resp = api_client.get(self.URL, {'raza': 'labrador'})
        results = resp.data.get('results', resp.data)
        assert len(results) == 1

    def test_filter_by_color(self, api_client, location_factory):
        location_factory(color='negro')
        location_factory(color='blanco')
        resp = api_client.get(self.URL, {'color': 'negro'})
        results = resp.data.get('results', resp.data)
        assert len(results) == 1


class TestBuscarCercanos:
    URL = '/api/ubicaciones/buscar_cercanos/'

    def test_busqueda_basica(self, api_client, location_factory):
        # Bogota
        location_factory(latitud=4.7110, longitud=-74.0721)
        # Medellin (lejos)
        location_factory(latitud=6.2476, longitud=-75.5658)

        resp = api_client.post(self.URL, {
            'latitud': 4.7110,
            'longitud': -74.0721,
            'radio_km': 50,
            'tipo_reporte': 'ambos',
        }, format='json')
        assert resp.status_code == 200
        assert resp.data['total_encontrados'] == 1
        assert resp.data['radio_km'] == 50

    def test_filtra_por_tipo_reporte(self, api_client, location_factory):
        location_factory(latitud=4.71, longitud=-74.07, tipo_reporte='perdido')
        location_factory(latitud=4.71, longitud=-74.07, tipo_reporte='encontrado')

        resp = api_client.post(self.URL, {
            'latitud': 4.71,
            'longitud': -74.07,
            'radio_km': 10,
            'tipo_reporte': 'perdido',
        }, format='json')
        assert resp.data['total_encontrados'] == 1
        assert resp.data['reportes'][0]['tipo_reporte'] == 'perdido'

    def test_payload_invalido(self, api_client):
        resp = api_client.post(self.URL, {'latitud': 'abc'}, format='json')
        assert resp.status_code == 400


class TestObtenerCercanos:
    def test_obtener_cercanos_ok(self, api_client, location_factory):
        principal = location_factory(
            latitud=4.71, longitud=-74.07, tipo_reporte='perdido',
        )
        # Opuesto cerca
        location_factory(latitud=4.711, longitud=-74.071, tipo_reporte='encontrado')
        # Opuesto lejos
        location_factory(latitud=6.24, longitud=-75.56, tipo_reporte='encontrado')

        resp = api_client.get(f'/api/ubicaciones/{principal.pk}/obtener_cercanos/?radio=5')
        assert resp.status_code == 200
        assert resp.data['total'] == 1
        assert resp.data['tipo_busqueda'] == 'encontrado'

    def test_obtener_cercanos_404(self, api_client):
        resp = api_client.get('/api/ubicaciones/99999/obtener_cercanos/')
        assert resp.status_code == 404

    def test_obtener_cercanos_tipo_encontrado_busca_perdidos(self, api_client, location_factory):
        principal = location_factory(
            latitud=4.71, longitud=-74.07, tipo_reporte='encontrado',
        )
        location_factory(latitud=4.711, longitud=-74.071, tipo_reporte='perdido')
        resp = api_client.get(f'/api/ubicaciones/{principal.pk}/obtener_cercanos/')
        assert resp.data['tipo_busqueda'] == 'perdido'
        assert resp.data['total'] == 1


class TestStatsGeografico:
    def test_stats_ok(self, api_client, location_factory):
        location_factory(tipo_reporte='perdido', tipo_animal='perro')
        location_factory(tipo_reporte='perdido', tipo_animal='perro')
        location_factory(tipo_reporte='encontrado', tipo_animal='gato')
        resp = api_client.post('/api/ubicaciones/stats_geografico/', {}, format='json')
        assert resp.status_code == 200
        assert resp.data['total_reportes'] == 3
        assert resp.data['perdidos'] == 2
        assert resp.data['encontrados'] == 1
        assert resp.data['tipo_animal_mas_reportado']['tipo_animal'] == 'perro'


class TestCrearLocation:
    def test_post_crea_location(self, api_client):
        payload = {
            'reporte_id': 'rep-new-1',
            'pet_id': 'pet-1',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'titulo': 'Mi perro perdido',
            'descripcion': 'Pequeño',
            'latitud': 4.71,
            'longitud': -74.07,
            'imagen_url': 'http://example.com/foo.jpg',
        }
        resp = api_client.post('/api/ubicaciones/', payload, format='json')
        assert resp.status_code == 201
        assert Location.objects.filter(reporte_id='rep-new-1').exists()
