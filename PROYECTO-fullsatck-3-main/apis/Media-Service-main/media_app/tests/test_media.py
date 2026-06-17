"""Tests MediaService (FASE 2B)."""
import tempfile
import uuid
from io import BytesIO

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from rest_framework.test import APIClient

from media_app.models import PetImage
from media_app.serializers import PetImageSerializer


pytestmark = pytest.mark.django_db


def _make_image(name='test.jpg', fmt='JPEG', content_type='image/jpeg'):
    """Genera un SimpleUploadedFile con una imagen real de 10x10 px."""
    img = Image.new('RGB', (10, 10), color='red')
    buf = BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type=content_type)


@pytest.fixture(autouse=True)
def use_tmp_media_root(settings, tmp_path):
    """Redirige MEDIA_ROOT a tmp para que los uploads de test no contaminen el repo."""
    settings.MEDIA_ROOT = str(tmp_path / 'media')


@pytest.fixture
def api_client():
    return APIClient()


# =====================================================================
# Model
# =====================================================================

class TestPetImageModel:
    def test_create_with_image(self):
        pet = PetImage.objects.create(image=_make_image(), pet_id='pet-abc-123')
        assert pet.pk is not None
        assert isinstance(pet.id, uuid.UUID)
        assert pet.pet_id == 'pet-abc-123'
        assert pet.uploaded_at is not None

    def test_id_is_uuid_and_unique(self):
        a = PetImage.objects.create(image=_make_image())
        b = PetImage.objects.create(image=_make_image('b.jpg'))
        assert a.id != b.id

    def test_pet_id_nullable(self):
        pet = PetImage.objects.create(image=_make_image())
        assert pet.pet_id is None

    def test_str_representation(self):
        pet = PetImage.objects.create(image=_make_image(), pet_id='abc')
        assert 'Imagen' in str(pet)
        assert 'abc' in str(pet)

    def test_upload_path_uses_pets_uploaded_folder(self):
        pet = PetImage.objects.create(image=_make_image('foo.jpg'))
        assert 'pets_uploaded/' in pet.image.name


# =====================================================================
# Serializer
# =====================================================================

class TestPetImageSerializer:
    def test_valid_payload(self):
        s = PetImageSerializer(data={
            'image': _make_image(),
            'pet_id': 'p-1',
        })
        assert s.is_valid(), s.errors

    def test_image_required(self):
        s = PetImageSerializer(data={'pet_id': 'p-1'})
        assert not s.is_valid()
        assert 'image' in s.errors

    def test_pet_id_optional(self):
        s = PetImageSerializer(data={'image': _make_image()})
        assert s.is_valid(), s.errors

    def test_serializer_returns_image_url(self):
        pet = PetImage.objects.create(image=_make_image(), pet_id='p-2')
        s = PetImageSerializer(instance=pet)
        assert 'image' in s.data
        assert s.data['image']  # tiene path/url
        # Nuevo: image_url debe ser absoluta para que el navegador la cargue
        assert 'image_url' in s.data
        assert s.data['image_url'].startswith('http')
        assert '/media/' in s.data['image_url']

    def test_serializer_image_url_uses_env_base(self, monkeypatch):
        monkeypatch.setenv('MEDIA_PUBLIC_URL', 'http://media.example.com')
        pet = PetImage.objects.create(image=_make_image(), pet_id='p-3')
        s = PetImageSerializer(instance=pet)
        assert s.data['image_url'].startswith('http://media.example.com/media/')


# =====================================================================
# Views
# =====================================================================

class TestImageUploadView:
    URL = '/api/media/upload/'

    def test_upload_ok_201(self, api_client):
        resp = api_client.post(
            self.URL,
            {'image': _make_image(), 'pet_id': 'pet-001'},
            format='multipart',
        )
        assert resp.status_code == 201
        assert 'id' in resp.data
        assert resp.data['pet_id'] == 'pet-001'
        assert resp.data['image']  # url no vacia

    def test_upload_ok_without_pet_id(self, api_client):
        resp = api_client.post(
            self.URL,
            {'image': _make_image()},
            format='multipart',
        )
        assert resp.status_code == 201

    def test_upload_missing_image_400(self, api_client):
        resp = api_client.post(self.URL, {'pet_id': 'pet-001'}, format='multipart')
        assert resp.status_code == 400
        assert 'image' in resp.data

    def test_upload_empty_payload_400(self, api_client):
        resp = api_client.post(self.URL, {}, format='multipart')
        assert resp.status_code == 400

    def test_upload_png_format_works(self, api_client):
        resp = api_client.post(
            self.URL,
            {'image': _make_image('foo.png', fmt='PNG', content_type='image/png')},
            format='multipart',
        )
        assert resp.status_code == 201

    def test_upload_non_image_file_400(self, api_client):
        bad = SimpleUploadedFile('hack.txt', b'no soy imagen', content_type='text/plain')
        resp = api_client.post(self.URL, {'image': bad}, format='multipart')
        assert resp.status_code == 400


# =====================================================================
# Urls config
# =====================================================================

class TestUrlsConfig:
    def test_upload_url_resolves(self):
        from django.urls import resolve
        match = resolve('/api/media/upload/')
        assert match.func.view_class.__name__ == 'ImageUploadView'
