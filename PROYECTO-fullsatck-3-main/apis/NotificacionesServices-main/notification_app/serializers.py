from rest_framework import serializers

class TriggerNotificationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    user_email = serializers.EmailField(required=True)
    match_id = serializers.IntegerField(required=True)
    pet_name = serializers.CharField(max_length=100, required=True)
    
    def validate_user_id(self, value):
        """Validar que user_id sea positivo"""
        if value <= 0:
            raise serializers.ValidationError("user_id debe ser mayor a 0")
        return value
    
    def validate_match_id(self, value):
        """Validar que match_id sea positivo"""
        if value <= 0:
            raise serializers.ValidationError("match_id debe ser mayor a 0")
        return value
    
    def validate_pet_name(self, value):
        """Validar que pet_name no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError("pet_name no puede estar vacío")
        return value.strip()