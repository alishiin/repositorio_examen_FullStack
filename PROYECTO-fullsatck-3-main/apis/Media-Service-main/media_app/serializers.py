import os
from rest_framework import serializers
from .models import PetImage


class PetImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PetImage
        fields = ['id', 'image', 'image_url', 'uploaded_at', 'pet_id']

    def get_image_url(self, obj):
        """Devuelve la URL absoluta de la imagen para que el navegador la cargue desde MediaService."""
        if not obj.image:
            return None
        base = os.environ.get('MEDIA_PUBLIC_URL', 'http://localhost:8006')
        return f"{base}{obj.image.url}"
