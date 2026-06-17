from django.urls import path
from .views import (
    TriggerMatchNotificationView,
    NotificationListView,
    NotificationMarkReadView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('trigger-match/', TriggerMatchNotificationView.as_view(), name='trigger-match-notification'),
]
