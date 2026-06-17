"""Tests del model User (FASE 2A)."""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from users.models import User


pytestmark = pytest.mark.django_db


class TestUserModel:
    def test_create_user_minimal(self, user_factory):
        u = user_factory()
        assert u.pk is not None
        assert u.email
        assert u.rut
        assert u.full_name

    def test_password_is_hashed(self, user_factory):
        u = user_factory(password='miclave1234')
        assert u.password != 'miclave1234'
        assert u.check_password('miclave1234')

    def test_str_representation(self, user_factory):
        u = user_factory(full_name='Juan Perez', rut='12345678-5')
        assert str(u) == 'Juan Perez (12345678-5)'

    def test_email_must_be_unique(self, user_factory):
        user_factory(email='dup@example.com')
        with pytest.raises(IntegrityError):
            user_factory(email='dup@example.com')

    def test_rut_must_be_unique(self, user_factory):
        user_factory(rut='12345678-5')
        with pytest.raises(IntegrityError):
            user_factory(rut='12345678-5')

    def test_db_table_name(self):
        assert User._meta.db_table == 'users_user'

    def test_invalid_rut_raises_validation_error(self, user_factory):
        # full_clean dispara los validators del campo.
        u = user_factory()
        u.rut = '12345678-9'  # DV incorrecto (correcto seria 5)
        with pytest.raises(ValidationError):
            u.full_clean()

    def test_invalid_phone_raises_validation_error(self, user_factory):
        u = user_factory()
        u.phone = '12345'  # no matchea ningun formato chileno
        with pytest.raises(ValidationError):
            u.full_clean()
