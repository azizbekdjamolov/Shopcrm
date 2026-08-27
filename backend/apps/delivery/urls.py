from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.DeliveryViewSet, basename='delivery')
router.register(r'ratings', views.CourierRatingViewSet, basename='courier-rating')
router.register(r'courier-dashboard', views.CourierDashboardView, basename='courier-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
