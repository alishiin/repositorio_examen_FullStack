from django.urls import path
from .views import TriggerMatchNotificationView

urlpatterns = [
    path('trigger-match/', TriggerMatchNotificationView.as_view(), name='trigger-match-notification'),
]