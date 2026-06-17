from django.urls import path

from .views import AnalyzePetImageView, FindMatchesView


urlpatterns = [
    path('analyze/', AnalyzePetImageView.as_view(), name='analyze-pet-image'),
    path('find-matches/', FindMatchesView.as_view(), name='find-matches'),
]
