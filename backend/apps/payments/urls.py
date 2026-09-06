from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PaymentViewSet, basename='payment')

urlpatterns = [
    path('webhook/click/', views.click_callback, name='click-callback'),
    path('webhook/payme/', views.payme_callback, name='payme-callback'),
    path('', include(router.urls)),
]
