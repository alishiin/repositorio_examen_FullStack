"""Shared fixtures and helpers for users tests (FASE 2A)."""
import pytest
from rest_framework.test import APIClient
from users.models import User


# RUTs chilenos validos calculados (8 digitos + DV correcto).
VALID_RUTS = [
    '12345678-5',
    '11111111-1',
    '22222222-2',
    '19876543-0',
    '15555555-6',
    '10000000-8',
]


def make_user_payload(**overrides):
    """Devuelve un payload base valido para crear usuario via API."""
    base = {
        'username': 'pepe',
        'email': 'pepe@example.com',
        'password': 'supersecret123',
        'full_name': 'Pepe Perez',
        'rut': '12345678-5',
        'phone': '9 1234 5678',
        'commune': 'Providencia',
        'address': 'Av. Siempre Viva 123',
    }
    base.update(overrides)
    return base


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Fabrica de usuarios para tests (asegura RUT unico por llamada)."""
    counter = {'i': 0}

    def _make(**overrides):
        counter['i'] += 1
        i = counter['i']
        defaults = {
            'username': f'user_{i}',
            'email': f'user_{i}@example.com',
            'full_name': f'User Number {i}',
            'rut': VALID_RUTS[(i - 1) % len(VALID_RUTS)],
            'phone': '9 1234 5678',
            'commune': 'Providencia',
            'address': 'Av. Test 123',
        }
        defaults.update(overrides)
        password = defaults.pop('password', 'supersecret123')
        user = User(**defaults)
        user.set_password(password)
        user.save()
        return user

    return _make


@pytest.fixture
def authed_client(api_client, user_factory):
    """APIClient con un user autenticado via force_authenticate."""
    user = user_factory()
    api_client.force_authenticate(user=user)
    api_client.user = user
    return api_client
