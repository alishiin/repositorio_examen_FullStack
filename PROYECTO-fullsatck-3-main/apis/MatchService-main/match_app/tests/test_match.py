"""Tests MatchService (FASE 2B).

CRITICO: nunca llamamos Google Gemini real. SIEMPRE mockeamos
`GeminiPetAnalyzer.analyze_pet_image` o `genai.Client`.
"""
from io import BytesIO
from unittest.mock import patch, MagicMock

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from match_app.models import PetAnalysis, MatchResult
from match_app import gemini_service


pytestmark = pytest.mark.django_db


def _make_image(name='test.jpg', fmt='JPEG', content_type='image/jpeg'):
    img = Image.new('RGB', (10, 10), color='blue')
    buf = BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type=content_type)


@pytest.fixture
def api_client():
    return APIClient()


# =====================================================================
# Models
# =====================================================================

class TestPetAnalysisModel:
    def test_create(self):
        a = PetAnalysis.objects.create(
            report_id=1, pet_type='perro', ai_description='Labrador negro'
        )
        assert a.pk is not None
        assert a.created_at is not None

    def test_str_representation(self):
        a = PetAnalysis.objects.create(
            report_id=42, pet_type='gato', ai_description='gris'
        )
        s = str(a)
        assert '42' in s
        assert 'gato' in s

    def test_report_id_unique(self):
        from django.db import IntegrityError
        PetAnalysis.objects.create(report_id=10, pet_type='perro', ai_description='x')
        with pytest.raises(IntegrityError):
            PetAnalysis.objects.create(report_id=10, pet_type='gato', ai_description='y')


class TestMatchResultModel:
    def test_create_defaults(self):
        m = MatchResult.objects.create(lost_report_id=1, found_report_id=2)
        assert m.is_confirmed is False
        assert m.created_at is not None

    def test_str_representation(self):
        m = MatchResult.objects.create(lost_report_id=7, found_report_id=8)
        s = str(m)
        assert '7' in s and '8' in s


# =====================================================================
# View: AnalyzePetImageView (mockeando Gemini)
# =====================================================================

class TestAnalyzeView:
    URL = '/api/match/analyze/'

    def _post(self, client, **overrides):
        data = {
            'report_id': 1,
            'pet_type': 'perro',
            'image': _make_image(),
        }
        data.update(overrides)
        return client.post(self.URL, data, format='multipart')

    def test_analyze_ok(self, api_client):
        fake = 'Perro labrador color negro con orejas caidas, tamano mediano.'
        with patch(
            'match_app.views.GeminiPetAnalyzer.analyze_pet_image',
            return_value=fake,
        ):
            resp = self._post(api_client, report_id=1001)
        assert resp.status_code == 201
        assert resp.data['descripcion_automatica'] == fake
        assert int(resp.data['report_id']) == 1001
        # Verifica que se persistio.
        assert PetAnalysis.objects.filter(report_id=1001).exists()

    def test_analyze_missing_image_400(self, api_client):
        resp = api_client.post(
            self.URL,
            {'report_id': 2, 'pet_type': 'gato'},
            format='multipart',
        )
        assert resp.status_code == 400
        assert 'error' in resp.data

    def test_analyze_missing_pet_type_400(self, api_client):
        resp = api_client.post(
            self.URL,
            {'report_id': 3, 'image': _make_image()},
            format='multipart',
        )
        assert resp.status_code == 400

    def test_analyze_missing_report_id_400(self, api_client):
        resp = api_client.post(
            self.URL,
            {'pet_type': 'perro', 'image': _make_image()},
            format='multipart',
        )
        assert resp.status_code == 400

    def test_analyze_gemini_raises_returns_500(self, api_client):
        with patch(
            'match_app.views.GeminiPetAnalyzer.analyze_pet_image',
            side_effect=RuntimeError('gemini muerto'),
        ):
            resp = self._post(api_client, report_id=2002)
        assert resp.status_code == 500
        assert 'error' in resp.data
        assert 'gemini muerto' in resp.data['error']

    def test_analyze_duplicate_report_id_raises_500(self, api_client):
        """report_id es unique => segunda llamada con mismo id => IntegrityError => 500."""
        PetAnalysis.objects.create(report_id=3003, pet_type='perro', ai_description='ya')
        with patch(
            'match_app.views.GeminiPetAnalyzer.analyze_pet_image',
            return_value='dup',
        ):
            resp = self._post(api_client, report_id=3003)
        assert resp.status_code == 500


# =====================================================================
# GeminiPetAnalyzer: caminos de error sin llamar API real
# =====================================================================

class TestGeminiPetAnalyzerErrorPaths:
    """Mockeamos `genai.Client` para que cada init/llamada lance un error
    distinto y caminamos los branches del except."""

    def _run(self, exception):
        with patch('match_app.gemini_service.genai.Client') as mock_client:
            mock_client.side_effect = exception
            img = _make_image()
            return gemini_service.GeminiPetAnalyzer.analyze_pet_image(img)

    def test_handles_503_error(self):
        result = self._run(Exception('503 Service Unavailable'))
        assert 'saturado' in result.lower() or 'IA' in result

    def test_handles_overloaded_error(self):
        result = self._run(Exception('model is overloaded'))
        assert 'saturado' in result.lower() or 'IA' in result

    def test_handles_auth_401_error(self):
        result = self._run(Exception('401 unauthorized'))
        assert 'autenticacion' in result.lower() or 'autenticación' in result.lower()

    def test_handles_timeout_error(self):
        result = self._run(Exception('request timed out'))
        assert 'tard' in result.lower() or 'timeout' in result.lower()

    def test_handles_image_error(self):
        result = self._run(Exception('PIL failed to parse image'))
        # cae en el branch de "image"/"PIL"
        assert 'imagen' in result.lower() or 'IA' in result

    def test_handles_generic_error_fallback(self):
        result = self._run(Exception('random failure XYZ'))
        # Fallback generico => "no se pudo generar"
        assert 'no se pudo' in result.lower() or 'manualmente' in result.lower()

    def test_returns_text_on_success(self):
        """Mockeamos Client().models.generate_content para devolver respuesta canned."""
        with patch('match_app.gemini_service.genai.Client') as mock_client:
            mock_response = MagicMock()
            mock_response.text = 'Descripcion mockeada de un golden retriever amarillo.'
            mock_client.return_value.models.generate_content.return_value = mock_response

            img = _make_image()
            result = gemini_service.GeminiPetAnalyzer.analyze_pet_image(img)
            assert result == 'Descripcion mockeada de un golden retriever amarillo.'


# =====================================================================
# URLs
# =====================================================================

class TestUrlsConfig:
    def test_analyze_url(self):
        from django.urls import resolve
        m = resolve('/api/match/analyze/')
        assert m.func.view_class.__name__ == 'AnalyzePetImageView'
