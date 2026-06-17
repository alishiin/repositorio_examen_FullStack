from rest_framework import serializers
from .models import PetImage

class PetImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetImage
        # Definimos los campos que se enviarán y recibirán por la API
        fields = ['id', 'image', 'uploaded_at', 'pet_id']