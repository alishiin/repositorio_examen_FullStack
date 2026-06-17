from django.urls import path, include
from rest_framework.routers import DefaultRouter
from geo_app.views import LocationViewSet
from geo_app.health_check import (
    health_check, 
    readiness_check, 
    liveness_check
)

# API Router
router = DefaultRouter()
router.register(r'ubicaciones', LocationViewSet, basename='location')

urlpatterns = [
    # Health Check Endpoints
    path('health', health_check, name='health'),
    path('ready', readiness_check, name='ready'),
    path('alive', liveness_check, name='alive'),
    
    # API endpoints
    path('api/', include(router.urls)),
]
