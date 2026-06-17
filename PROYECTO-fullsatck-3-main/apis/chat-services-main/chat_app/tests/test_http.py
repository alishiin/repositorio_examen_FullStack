"""Tests HTTP del ChatService (FASE 2C)."""
import pytest
from rest_framework.test import APIClient

from chat_app.models import Message


pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


# =====================================================================
# Model: Message
# =====================================================================

class TestMessageModel:
    def test_create_message(self):
        m = Message.objects.create(
            room_name='sala-1', sender='alice', content='hola mundo'
        )
        assert m.pk is not None
        assert m.timestamp is not None

    def test_str_truncates_content(self):
        long_content = 'a' * 100
        m = Message.objects.create(
            room_name='room', sender='bob', content=long_content
        )
        s = str(m)
        assert 'bob' in s
        assert 'room' in s
        # __str__ usa content[:20]
        assert 'a' * 20 in s


# =====================================================================
# HTTP Views
# =====================================================================

class TestHealthCheck:
    def test_health_returns_200_with_status(self, api_client):
        resp = api_client.get('/api/chat/health/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['status'] == 'OK'
        assert data['service'] == 'Chat Service'


class TestGetChatConfig:
    def test_config_returns_ws_url(self, api_client):
        resp = api_client.get('/api/chat/config/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        assert 'wsUrl' in data
        assert data['wsUrl'].startswith('ws')
        assert 'endpoints' in data
        assert 'ws_connection' in data['endpoints']

    def test_config_respects_env_vars(self, api_client, monkeypatch):
        monkeypatch.setenv('CHAT_WS_HOST', 'chat.example.com')
        monkeypatch.setenv('CHAT_WS_PORT', '9999')
        monkeypatch.setenv('CHAT_WS_PROTOCOL', 'wss')
        resp = api_client.get('/api/chat/config/')
        data = resp.json()
        assert data['wsUrl'] == 'wss://chat.example.com:9999'


class TestValidateRoomAccess:
    def test_validate_authorized(self, api_client):
        resp = api_client.get('/api/chat/room/sala-mascotas/validate/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['authorized'] is True
        assert data['room'] == 'sala-mascotas'
        assert data['wsEndpoint'].endswith('/ws/chat/sala-mascotas/')


# =====================================================================
# URL conf
# =====================================================================

class TestUrlsConfig:
    def test_health_url(self):
        from django.urls import resolve
        m = resolve('/api/chat/health/')
        assert m.url_name == 'health_check'

    def test_config_url(self):
        from django.urls import resolve
        m = resolve('/api/chat/config/')
        assert m.url_name == 'get_chat_config'

    def test_validate_url(self):
        from django.urls import resolve
        m = resolve('/api/chat/room/abc/validate/')
        assert m.url_name == 'validate_room_access'
        assert m.kwargs == {'room_name': 'abc'}
