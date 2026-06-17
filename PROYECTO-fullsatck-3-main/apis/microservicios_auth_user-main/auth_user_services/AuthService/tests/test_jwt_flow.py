"""Tests del AuthService (FASE 2A).

NOTA: AuthService es un servicio minimo que solo expone:
  - POST /login/    -> SimpleJWT TokenObtainPairView
  - POST /refresh/  -> SimpleJWT TokenRefreshView

Usa el User default de Django (auth.User). Estos tests verifican el flujo JWT end-to-end.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db
User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='alice',
        email='alice@example.com',
        password='superSecret123',
    )


class TestLoginEndpoint:
    """POST /login/ devuelve par de tokens JWT (access + refresh)."""

    def test_login_ok(self, api_client, user):
        resp = api_client.post(
            '/login/',
            {'username': 'alice', 'password': 'superSecret123'},
            format='json',
        )
        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data

    def test_login_wrong_password_401(self, api_client, user):
        resp = api_client.post(
            '/login/',
            {'username': 'alice', 'password': 'wrong'},
            format='json',
        )
        assert resp.status_code == 401

    def test_login_unknown_user_401(self, api_client):
        resp = api_client.post(
            '/login/',
            {'username': 'ghost', 'password': 'whatever'},
            format='json',
        )
        assert resp.status_code == 401

    def test_login_missing_fields_400(self, api_client):
        resp = api_client.post('/login/', {}, format='json')
        assert resp.status_code == 400


class TestRefreshEndpoint:
    """POST /refresh/ acepta un refresh token valido y devuelve nuevo access."""

    def test_refresh_ok(self, api_client, user):
        obtain = api_client.post(
            '/login/',
            {'username': 'alice', 'password': 'superSecret123'},
            format='json',
        )
        refresh_token = obtain.data['refresh']

        resp = api_client.post(
            '/refresh/',
            {'refresh': refresh_token},
            format='json',
        )
        assert resp.status_code == 200
        assert 'access' in resp.data

    def test_refresh_invalid_token_401(self, api_client):
        resp = api_client.post(
            '/refresh/',
            {'refresh': 'not-a-valid-jwt'},
            format='json',
        )
        assert resp.status_code == 401

    def test_refresh_missing_field_400(self, api_client):
        resp = api_client.post('/refresh/', {}, format='json')
        assert resp.status_code == 400


class TestJwtClaims:
    """Verifica que el access token tiene los claims esperados."""

    def test_access_token_contains_user_id(self, api_client, user):
        from rest_framework_simplejwt.tokens import AccessToken

        obtain = api_client.post(
            '/login/',
            {'username': 'alice', 'password': 'superSecret123'},
            format='json',
        )
        access = AccessToken(obtain.data['access'])
        # SimpleJWT >=5.3 serializa user_id como string; aceptamos ambos.
        assert str(access['user_id']) == str(user.pk)
        assert access['token_type'] == 'access'


class TestUrlsConfig:
    """Asserts a nivel URL conf para garantizar endpoints declarados."""

    def test_login_url_exists(self):
        from django.urls import resolve
        match = resolve('/login/')
        assert match.func.view_class.__name__ == 'TokenObtainPairView'

    def test_refresh_url_exists(self):
        from django.urls import resolve
        match = resolve('/refresh/')
        assert match.func.view_class.__name__ == 'TokenRefreshView'

    def test_admin_url_exists(self):
        from django.urls import resolve
        match = resolve('/admin/')
        assert match.app_name == 'admin'
