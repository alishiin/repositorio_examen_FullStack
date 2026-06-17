"""Tests del UserSerializer (FASE 2A)."""
import pytest
from users.serializers import UserSerializer
from users.models import User
from .conftest import make_user_payload


pytestmark = pytest.mark.django_db


class TestUserSerializer:
    def test_valid_payload(self):
        s = UserSerializer(data=make_user_payload())
        assert s.is_valid(), s.errors

    def test_password_is_write_only(self, user_factory):
        u = user_factory()
        s = UserSerializer(instance=u)
        assert 'password' not in s.data

    def test_create_hashes_password(self):
        s = UserSerializer(data=make_user_payload())
        assert s.is_valid(), s.errors
        u = s.save()
        assert u.password != make_user_payload()['password']
        assert u.check_password(make_user_payload()['password'])

    def test_password_min_length(self):
        s = UserSerializer(data=make_user_payload(password='short'))
        assert not s.is_valid()
        assert 'password' in s.errors

    def test_email_required(self):
        payload = make_user_payload()
        payload.pop('email')
        s = UserSerializer(data=payload)
        assert not s.is_valid()
        assert 'email' in s.errors

    def test_full_name_required(self):
        payload = make_user_payload()
        payload.pop('full_name')
        s = UserSerializer(data=payload)
        assert not s.is_valid()
        assert 'full_name' in s.errors

    def test_rut_required(self):
        payload = make_user_payload()
        payload.pop('rut')
        s = UserSerializer(data=payload)
        assert not s.is_valid()
        assert 'rut' in s.errors

    def test_update_does_not_change_password(self, user_factory):
        u = user_factory(password='oldpassword123')
        old_hash = u.password
        s = UserSerializer(
            instance=u,
            data={
                'username': u.username,
                'email': u.email,
                'full_name': 'Nuevo Nombre',
                'rut': u.rut,
                'phone': u.phone,
                'commune': u.commune,
                'address': u.address,
                'password': 'newpassword999',
            },
        )
        assert s.is_valid(), s.errors
        updated = s.save()
        assert updated.full_name == 'Nuevo Nombre'
        # El password viejo sigue funcionando.
        assert updated.password == old_hash
        assert updated.check_password('oldpassword123')

    def test_serializer_fields(self):
        expected = {
            'id', 'username', 'email', 'password',
            'full_name', 'rut', 'phone', 'commune', 'address',
        }
        assert set(UserSerializer.Meta.fields) == expected
