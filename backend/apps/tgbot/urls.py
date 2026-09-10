from django.urls import path

from .views import phone_verify_confirm, phone_verify_request, status, webhook

urlpatterns = [
    path('webhook/<str:secret>/', webhook, name='tg-webhook'),
    path('status/', status, name='tg-status'),
    path('phone-verify/request/', phone_verify_request, name='tg-phone-verify-request'),
    path('phone-verify/confirm/', phone_verify_confirm, name='tg-phone-verify-confirm'),
]