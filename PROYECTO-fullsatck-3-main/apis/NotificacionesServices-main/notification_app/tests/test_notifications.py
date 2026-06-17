"""Tests NotificationService (FASE 2B)."""
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from notification_app.models import Notification
from notification_app.serializers import (
    NotificationSerializer,
    TriggerNotificationSerializer,
)
from notification_app.services import NotificationSenderService


pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def notification_factory(db):
    counter = {'i': 0}

    def _make(**overrides):
        counter['i'] += 1
        i = counter['i']
        defaults = {
            'user_id': i,
            'match_id': i + 100,
            'title': f'Notif {i}',
            'message': 'mensaje de prueba',
            'notification_type': 'MATCH',
            'status': 'PENDING',
        }
        defaults.update(overrides)
        return Notification.objects.create(**defaults)

    return _make


# =====================================================================
# Models
# =====================================================================

class TestNotificationModel:
    def test_create_with_defaults(self, notification_factory):
        n = notification_factory()
        assert n.pk is not None
        assert n.status == 'PENDING'
        assert n.read is False
        assert n.notification_type == 'MATCH'
        assert n.created_at is not None
        assert n.sent_at is None

    def test_str_representation(self, notification_factory):
        n = notification_factory(user_id=42, status='SENT', notification_type='MATCH')
        s = str(n)
        assert 'MATCH' in s
        assert '42' in s
        assert 'SENT' in s

    def test_type_choices_match(self):
        assert dict(Notification.TYPES)['MATCH']
        assert dict(Notification.TYPES)['SYSTEM']

    def test_status_choices_match(self):
        assert dict(Notification.STATUS)['PENDING']
        assert dict(Notification.STATUS)['SENT']
        assert dict(Notification.STATUS)['FAILED']

    def test_match_id_nullable(self, notification_factory):
        n = notification_factory(match_id=None)
        assert n.match_id is None

    def test_read_default_false(self):
        n = Notification.objects.create(
            user_id=1, title='t', message='m', notification_type='SYSTEM',
        )
        assert n.read is False


# =====================================================================
# Serializers
# =====================================================================

class TestNotificationSerializer:
    def test_serialize_instance(self, notification_factory):
        n = notification_factory()
        s = NotificationSerializer(instance=n)
        expected_fields = {
            'id', 'user_id', 'match_id', 'title', 'message',
            'notification_type', 'status', 'read', 'created_at', 'sent_at',
        }
        assert set(s.data.keys()) == expected_fields

    def test_read_only_fields(self):
        s = NotificationSerializer()
        assert 'id' in s.Meta.read_only_fields
        assert 'created_at' in s.Meta.read_only_fields
        assert 'sent_at' in s.Meta.read_only_fields


class TestTriggerNotificationSerializer:
    VALID = {
        'user_id': 1,
        'user_email': 'alice@example.com',
        'match_id': 99,
        'pet_name': 'Firulais',
    }

    def test_valid_payload(self):
        s = TriggerNotificationSerializer(data=self.VALID)
        assert s.is_valid(), s.errors

    def test_invalid_email(self):
        s = TriggerNotificationSerializer(data={**self.VALID, 'user_email': 'no-email'})
        assert not s.is_valid()
        assert 'user_email' in s.errors

    def test_missing_user_email(self):
        bad = {k: v for k, v in self.VALID.items() if k != 'user_email'}
        s = TriggerNotificationSerializer(data=bad)
        assert not s.is_valid()
        assert 'user_email' in s.errors

    def test_user_id_must_be_positive(self):
        s = TriggerNotificationSerializer(data={**self.VALID, 'user_id': 0})
        assert not s.is_valid()
        assert 'user_id' in s.errors

    def test_match_id_must_be_positive(self):
        s = TriggerNotificationSerializer(data={**self.VALID, 'match_id': -1})
        assert not s.is_valid()
        assert 'match_id' in s.errors

    def test_pet_name_strip_and_required(self):
        s = TriggerNotificationSerializer(data={**self.VALID, 'pet_name': '   '})
        assert not s.is_valid()
        assert 'pet_name' in s.errors

    def test_pet_name_is_stripped_on_valid(self):
        s = TriggerNotificationSerializer(data={**self.VALID, 'pet_name': '  Rex  '})
        assert s.is_valid(), s.errors
        assert s.validated_data['pet_name'] == 'Rex'


# =====================================================================
# Services
# =====================================================================

class TestNotificationSenderService:
    def test_send_creates_notification_and_marks_sent(self):
        result = NotificationSenderService.send_match_notification(
            user_email='alice@example.com',
            user_id=10,
            match_id=200,
            pet_name='Toby',
        )
        assert result is True
        n = Notification.objects.get(user_id=10, match_id=200)
        assert n.status == 'SENT'
        assert n.sent_at is not None
        assert 'Toby' in n.message

    def test_send_marks_failed_when_save_fails(self):
        """Mockeamos `print` (primera linea del try) para forzar excepcion.
        El except hace status=FAILED + save() => return False.
        """
        with patch('builtins.print', side_effect=RuntimeError('boom')):
            result = NotificationSenderService.send_match_notification(
                user_email='bob@example.com',
                user_id=11,
                match_id=201,
                pet_name='Luna',
            )
        assert result is False
        n = Notification.objects.get(user_id=11, match_id=201)
        assert n.status == 'FAILED'


# =====================================================================
# Views: TriggerMatchNotificationView
# =====================================================================

class TestTriggerMatchView:
    URL = '/api/notifications/trigger-match/'

    def test_trigger_ok(self, api_client):
        resp = api_client.post(self.URL, {
            'user_id': 1,
            'user_email': 'alice@example.com',
            'match_id': 99,
            'pet_name': 'Rex',
        }, format='json')
        assert resp.status_code == 200
        assert resp.data['success'] is True
        assert 'notification_id' in resp.data

    def test_trigger_invalid_payload_400(self, api_client):
        resp = api_client.post(self.URL, {
            'user_id': 1,
            # falta user_email
            'match_id': 99,
            'pet_name': 'Rex',
        }, format='json')
        assert resp.status_code == 400
        assert resp.data['success'] is False
        assert 'details' in resp.data

    def test_trigger_service_failure_500(self, api_client):
        """Cuando el servicio devuelve False, la view devuelve 500."""
        with patch(
            'notification_app.views.NotificationSenderService.send_match_notification',
            return_value=False,
        ):
            resp = api_client.post(self.URL, {
                'user_id': 1,
                'user_email': 'a@b.com',
                'match_id': 5,
                'pet_name': 'P',
            }, format='json')
        assert resp.status_code == 500
        assert resp.data['success'] is False

    def test_trigger_unexpected_exception_500(self, api_client):
        with patch(
            'notification_app.views.NotificationSenderService.send_match_notification',
            side_effect=RuntimeError('explota'),
        ):
            resp = api_client.post(self.URL, {
                'user_id': 1,
                'user_email': 'a@b.com',
                'match_id': 5,
                'pet_name': 'P',
            }, format='json')
        assert resp.status_code == 500
        assert 'explota' in resp.data['error']


# =====================================================================
# Views: NotificationListView (GET ?user_id=X)
# =====================================================================

class TestNotificationListView:
    URL = '/api/notifications/'

    def test_list_filtered_by_user_id(self, api_client, notification_factory):
        notification_factory(user_id=1)
        notification_factory(user_id=1)
        notification_factory(user_id=2)
        resp = api_client.get(self.URL, {'user_id': 1})
        assert resp.status_code == 200
        assert len(resp.data) == 2
        assert all(n['user_id'] == 1 for n in resp.data)

    def test_list_without_user_id_returns_empty(self, api_client, notification_factory):
        notification_factory(user_id=1)
        resp = api_client.get(self.URL)
        assert resp.status_code == 200
        assert resp.data == []

    def test_list_orders_by_created_at_desc(self, api_client, notification_factory):
        n1 = notification_factory(user_id=5, title='primera')
        n2 = notification_factory(user_id=5, title='segunda')
        resp = api_client.get(self.URL, {'user_id': 5})
        # Mas reciente primero.
        assert resp.data[0]['id'] == n2.id
        assert resp.data[1]['id'] == n1.id

    def test_list_unknown_user_returns_empty(self, api_client):
        resp = api_client.get(self.URL, {'user_id': 9999})
        assert resp.status_code == 200
        assert resp.data == []


# =====================================================================
# Views: NotificationMarkReadView
# =====================================================================

class TestMarkReadView:
    def test_mark_read_ok(self, api_client, notification_factory):
        n = notification_factory(user_id=7)
        assert n.read is False
        resp = api_client.post(f'/api/notifications/{n.pk}/mark-read/', {}, format='json')
        assert resp.status_code == 200
        assert resp.data['read'] is True
        n.refresh_from_db()
        assert n.read is True

    def test_mark_read_nonexistent_404(self, api_client):
        resp = api_client.post('/api/notifications/9999/mark-read/', {}, format='json')
        assert resp.status_code == 404
        assert resp.data['success'] is False


# =====================================================================
# URL conf
# =====================================================================

class TestUrlsConfig:
    def test_trigger_url(self):
        from django.urls import resolve
        m = resolve('/api/notifications/trigger-match/')
        assert m.func.view_class.__name__ == 'TriggerMatchNotificationView'

    def test_list_url(self):
        from django.urls import resolve
        m = resolve('/api/notifications/')
        assert m.func.view_class.__name__ == 'NotificationListView'

    def test_mark_read_url(self):
        from django.urls import resolve
        m = resolve('/api/notifications/5/mark-read/')
        assert m.func.view_class.__name__ == 'NotificationMarkReadView'
        assert m.kwargs == {'pk': 5}
