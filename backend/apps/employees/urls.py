from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.EmployeeViewSet, basename='employee')
router.register(r'shifts', views.EmployeeShiftViewSet, basename='employee-shift')

urlpatterns = [
    path('', include(router.urls)),
]
