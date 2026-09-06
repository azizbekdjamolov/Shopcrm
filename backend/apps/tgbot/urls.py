from django.urls import path

from .views import status, webhook

urlpatterns = [
    path('webhook/<str:secret>/', webhook, name='tg-webhook'),
    path('status/', status, name='tg-status'),
]