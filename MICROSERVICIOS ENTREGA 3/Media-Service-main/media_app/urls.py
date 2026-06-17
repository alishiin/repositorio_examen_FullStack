from django.urls import path
from .views import ImageUploadView

urlpatterns = [
    # La ruta final será /api/media/upload/
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
]