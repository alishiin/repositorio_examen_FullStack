"""Tests para FindMatchesView - mock de clients para no hacer HTTP real."""
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from match_app.models import MatchResult


pytestmark = pytest.mark.django_db


URL = '/api/match/find-matches/'


@pytest.fixture
def api_client():
    return APIClient()


def _reporte(reporte_id, **kwargs):
    base = {
        'reporte_id': reporte_id,
        'tipo_animal': 'perro',
        'raza_probable': 'labrador',
        'color': 'negro',
        'tamaño': 'grande',
        'latitud': -33.45,
        'longitud': -70.65,
        'fecha_reporte': '2026-06-10',
        'usuario_id': 99,
    }
    base.update(kwargs)
    return base


class TestFindMatchesValidacion:
    def test_sin_report_id_400(self, api_client):
        resp = api_client.post(URL, {'tipo_reporte': 'perdido'}, format='json')
        assert resp.status_code == 400
        assert 'error' in resp.data

    def test_sin_tipo_reporte_400(self, api_client):
        resp = api_client.post(URL, {'report_id': 'rep_1'}, format='json')
        assert resp.status_code == 400

    def test_tipo_reporte_invalido_400(self, api_client):
        resp = api_client.post(
            URL,
            {'report_id': 'rep_1', 'tipo_reporte': 'cualquiera'},
            format='json',
        )
        assert resp.status_code == 400


class TestFindMatchesFlow:
    @patch('match_app.views.listar_reportes_opuestos', return_value=[])
    def test_sin_candidatos_devuelve_lista_vacia(self, _mock, api_client):
        resp = api_client.post(
            URL,
            {'report_id': 'rep_1', 'tipo_reporte': 'perdido', 'tipo_animal': 'perro'},
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['total'] == 0
        assert resp.data['matches'] == []

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_match_alto_pasa_umbral_y_persiste(self, mock_list, mock_notif, api_client):
        mock_list.return_value = [_reporte('rep_999')]

        payload = {
            'report_id': 'rep_origen',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
            'titulo': 'Toby perdido',
            'user_id': 7,
        }
        resp = api_client.post(URL, payload, format='json')
        assert resp.status_code == 200
        assert resp.data['total'] == 1
        assert resp.data['matches'][0]['score'] >= 50

        # Persistio en DB
        assert MatchResult.objects.filter(
            lost_report_id='rep_origen', found_report_id='rep_999'
        ).exists()
        # Disparo notificacion al usuario_id=99 del candidato (no a si mismo)
        mock_notif.assert_called_once()
        kwargs = mock_notif.call_args.kwargs
        assert kwargs['user_id'] == 99
        assert kwargs['pet_name'] == 'Toby perdido'

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_match_bajo_no_pasa_umbral(self, mock_list, mock_notif, api_client):
        # Candidato con datos muy distintos -> score < 50
        mock_list.return_value = [_reporte(
            'rep_otro',
            raza_probable='caniche',
            color='blanco',
            tamaño='pequeño',
            latitud=-50.0,  # patagonia
            longitud=-70.0,
            fecha_reporte='2024-01-01',  # muy viejo
        )]
        payload = {
            'report_id': 'rep_a',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
        }
        resp = api_client.post(URL, payload, format='json')
        assert resp.status_code == 200
        assert resp.data['total'] == 0
        mock_notif.assert_not_called()

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_no_se_matchea_con_uno_mismo(self, mock_list, _mock_notif, api_client):
        mock_list.return_value = [_reporte('rep_mio')]  # mismo id que el origen
        payload = {
            'report_id': 'rep_mio',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
        }
        resp = api_client.post(URL, payload, format='json')
        assert resp.data['total'] == 0

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_idempotencia_segunda_llamada_no_duplica(self, mock_list, _mock_notif, api_client):
        mock_list.return_value = [_reporte('rep_x')]
        payload = {
            'report_id': 'rep_origen',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
        }
        api_client.post(URL, payload, format='json')
        api_client.post(URL, payload, format='json')
        assert MatchResult.objects.filter(
            lost_report_id='rep_origen', found_report_id='rep_x'
        ).count() == 1

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_no_notifica_a_si_mismo(self, mock_list, mock_notif, api_client):
        # Candidato tiene mismo user_id que el origen
        mock_list.return_value = [_reporte('rep_otro', usuario_id=7)]
        payload = {
            'report_id': 'rep_origen',
            'tipo_reporte': 'perdido',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
            'user_id': 7,
        }
        api_client.post(URL, payload, format='json')
        mock_notif.assert_not_called()

    @patch('match_app.views.disparar_notificacion', return_value=True)
    @patch('match_app.views.listar_reportes_opuestos')
    def test_tipo_encontrado_invierte_lost_found(self, mock_list, _mock_notif, api_client):
        mock_list.return_value = [_reporte('rep_perdido_otro')]
        payload = {
            'report_id': 'rep_encontrado_mio',
            'tipo_reporte': 'encontrado',
            'tipo_animal': 'perro',
            'raza_probable': 'labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
        }
        api_client.post(URL, payload, format='json')
        # El reporte 'encontrado' va como found_report_id, el otro como lost
        assert MatchResult.objects.filter(
            lost_report_id='rep_perdido_otro',
            found_report_id='rep_encontrado_mio',
        ).exists()


class TestClientsModule:
    """Tests del modulo clients (cobertura)."""

    def test_listar_reportes_opuestos_tipo_invalido(self):
        from match_app.clients import listar_reportes_opuestos
        assert listar_reportes_opuestos('') == []
        assert listar_reportes_opuestos('cualquiera') == []

    def test_listar_reportes_opuestos_geo_falla(self):
        from match_app import clients
        with patch.object(clients.requests, 'get', side_effect=Exception('boom')):
            assert clients.listar_reportes_opuestos('perdido') == []

    def test_listar_reportes_opuestos_status_no_200(self):
        from match_app import clients

        class _Resp:
            status_code = 500
        with patch.object(clients.requests, 'get', return_value=_Resp()):
            assert clients.listar_reportes_opuestos('perdido') == []

    def test_listar_reportes_opuestos_lista_directa(self):
        from match_app import clients

        class _Resp:
            status_code = 200
            def json(self):
                return [{'reporte_id': 'a'}]
        with patch.object(clients.requests, 'get', return_value=_Resp()):
            assert clients.listar_reportes_opuestos('perdido') == [{'reporte_id': 'a'}]

    def test_listar_reportes_opuestos_paginado_drf(self):
        from match_app import clients

        class _Resp:
            status_code = 200
            def json(self):
                return {'results': [{'reporte_id': 'b'}]}
        with patch.object(clients.requests, 'get', return_value=_Resp()):
            assert clients.listar_reportes_opuestos('encontrado') == [{'reporte_id': 'b'}]

    def test_disparar_notificacion_sin_user_id(self):
        from match_app.clients import disparar_notificacion
        assert disparar_notificacion(None, 1, 'x', 80) is False

    def test_disparar_notificacion_ok(self):
        from match_app import clients

        class _Resp:
            status_code = 201
        with patch.object(clients.requests, 'post', return_value=_Resp()):
            assert clients.disparar_notificacion(7, 1, 'Toby', 80.5) is True

    def test_disparar_notificacion_falla(self):
        from match_app import clients
        with patch.object(clients.requests, 'post', side_effect=Exception('boom')):
            assert clients.disparar_notificacion(7, 1, 'x', 50) is False
