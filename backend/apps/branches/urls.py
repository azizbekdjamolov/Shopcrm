from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'settings', views.BranchSettingsViewSet, basename='branch-settings')
router.register(r'details', views.BranchDetailView, basename='branch-detail')

urlpatterns = [
    path('', include(router.urls)),
]
