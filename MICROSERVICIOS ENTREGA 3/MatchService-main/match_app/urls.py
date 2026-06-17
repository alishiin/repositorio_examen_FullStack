from django.urls import path
from .views import AnalyzePetImageView

urlpatterns = [
    path('analyze/', AnalyzePetImageView.as_view(), name='analyze-pet-image'),
]