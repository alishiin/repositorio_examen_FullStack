"""Tests de las vistas UserViewSet + LoginView (FASE 2A)."""
import pytest
from .conftest import make_user_payload, VALID_RUTS


pytestmark = pytest.mark.django_db


# =====================================================================
# UserViewSet (CRUD)
# =====================================================================

class TestUserViewSetCreate:
    """POST /users/ es AllowAny (registro)."""

    def test_register_ok(self, api_client):
        resp = api_client.post('/users/', make_user_payload(), format='json')
        assert resp.status_code == 201
        assert resp.data['username'] == 'pepe'
        assert resp.data['email'] == 'pepe@example.com'
        assert 'password' not in resp.data

    def test_register_duplicate_email_fails(self, api_client, user_factory):
        user_factory(email='dup@example.com')
        payload = make_user_payload(
            email='dup@example.com',
            username='otro',
            rut=VALID_RUTS[1],
        )
        resp = api_client.post('/users/', payload, format='json')
        assert resp.status_code == 400

    def test_register_invalid_rut_fails(self, api_client):
        resp = api_client.post(
            '/users/',
            make_user_payload(rut='12345678-9'),  # DV incorrecto
            format='json',
        )
        assert resp.status_code == 400

    def test_register_password_too_short_fails(self, api_client):
        resp = api_client.post(
            '/users/',
            make_user_payload(password='abc'),
            format='json',
        )
        assert resp.status_code == 400
        assert 'password' in resp.data


class TestUserViewSetRetrieve:
    """GET /users/<id>/ es AllowAny."""

    def test_retrieve_existing(self, api_client, user_factory):
        u = user_factory()
        resp = api_client.get(f'/users/{u.pk}/')
        assert resp.status_code == 200
        assert resp.data['id'] == u.pk

    def test_retrieve_nonexistent_404(self, api_client):
        resp = api_client.get('/users/999999/')
        assert resp.status_code == 404


class TestUserViewSetListProtected:
    """GET /users/ requiere auth (no esta en ['create','retrieve'])."""

    def test_list_unauth_401(self, api_client):
        resp = api_client.get('/users/')
        assert resp.status_code == 401

    def test_list_authed_200(self, authed_client, user_factory):
        user_factory()
        user_factory()
        resp = authed_client.get('/users/')
        assert resp.status_code == 200
        assert len(resp.data) >= 2  # al menos los 2 + el authed


class TestUserViewSetUpdateDelete:
    """PUT/PATCH/DELETE requieren auth."""

    def test_update_unauth_401(self, api_client, user_factory):
        u = user_factory()
        resp = api_client.patch(f'/users/{u.pk}/', {'full_name': 'Otro'}, format='json')
        assert resp.status_code == 401

    def test_partial_update_authed(self, authed_client):
        u = authed_client.user
        resp = authed_client.patch(
            f'/users/{u.pk}/',
            {'full_name': 'Nombre Cambiado'},
            format='json',
        )
        assert resp.status_code == 200
        u.refresh_from_db()
        assert u.full_name == 'Nombre Cambiado'

    def test_delete_unauth_401(self, api_client, user_factory):
        u = user_factory()
        resp = api_client.delete(f'/users/{u.pk}/')
        assert resp.status_code == 401

    def test_delete_authed(self, authed_client, user_factory):
        target = user_factory()
        resp = authed_client.delete(f'/users/{target.pk}/')
        assert resp.status_code == 204


# =====================================================================
# LoginView (POST /login/)
# =====================================================================

class TestLoginView:
    def test_login_ok_returns_tokens(self, api_client, user_factory):
        u = user_factory(email='login@example.com', password='secreto1234')
        resp = api_client.post(
            '/login/',
            {'email': 'login@example.com', 'password': 'secreto1234'},
            format='json',
        )
        assert resp.status_code == 200
        assert resp.data['success'] is True
        assert 'access' in resp.data
        assert 'refresh' in resp.data
        assert resp.data['user']['email'] == 'login@example.com'
        assert resp.data['user']['id'] == u.pk

    def test_login_missing_email_400(self, api_client):
        resp = api_client.post('/login/', {'password': 'foo123'}, format='json')
        assert resp.status_code == 400
        assert 'error' in resp.data

    def test_login_missing_password_400(self, api_client):
        resp = api_client.post('/login/', {'email': 'a@b.com'}, format='json')
        assert resp.status_code == 400

    def test_login_nonexistent_email_401(self, api_client):
        resp = api_client.post(
            '/login/',
            {'email': 'noexisto@example.com', 'password': 'whatever123'},
            format='json',
        )
        assert resp.status_code == 401

    def test_login_wrong_password_401(self, api_client, user_factory):
        user_factory(email='real@example.com', password='correcta123')
        resp = api_client.post(
            '/login/',
            {'email': 'real@example.com', 'password': 'incorrecta'},
            format='json',
        )
        assert resp.status_code == 401


# =====================================================================
# JWT (SimpleJWT TokenObtainPair, TokenRefresh) - integration
# =====================================================================

class TestJwtTokens:
    def test_token_obtain_with_username(self, api_client, user_factory):
        user_factory(username='jwtuser', password='secreto1234')
        resp = api_client.post(
            '/token/',
            {'username': 'jwtuser', 'password': 'secreto1234'},
            format='json',
        )
        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data

    def test_token_refresh(self, api_client, user_factory):
        user_factory(username='jwtuser2', password='secreto1234')
        obtain = api_client.post(
            '/token/',
            {'username': 'jwtuser2', 'password': 'secreto1234'},
            format='json',
        )
        refresh_token = obtain.data['refresh']
        resp = api_client.post(
            '/token/refresh/',
            {'refresh': refresh_token},
            format='json',
        )
        assert resp.status_code == 200
        assert 'access' in resp.data

    def test_token_refresh_invalid_400(self, api_client):
        resp = api_client.post(
            '/token/refresh/',
            {'refresh': 'this-is-not-a-valid-token'},
            format='json',
        )
        assert resp.status_code == 401
