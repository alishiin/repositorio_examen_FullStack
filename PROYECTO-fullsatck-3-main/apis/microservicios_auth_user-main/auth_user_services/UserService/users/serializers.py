from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 
            'username',
            'email', 
            'password',
            'full_name',
            'rut',
            'phone',
            'commune',
            'address',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'full_name': {'required': True},
            'rut': {'required': True},
            'phone': {'required': True},
            'commune': {'required': True},
            'address': {'required': True},
        }

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            rut=validated_data['rut'],
            phone=validated_data['phone'],
            commune=validated_data['commune'],
            address=validated_data['address'],
        )
        user.set_password(validated_data['password'])  # 🔐 HASH
        user.save()
        return user

    def update(self, instance, validated_data):
        # No permitir cambiar contraseña por este endpoint
        validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance