from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import admin_views

router = DefaultRouter()
router.register('businesses', admin_views.PlatformAdminBusinessViewSet, basename='admin-business')
router.register('users', admin_views.PlatformAdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('dashboard/', admin_views.PlatformAdminDashboardView.as_view({'get': 'list'}), name='admin-dashboard'),
    path('', include(router.urls)),
    path('businesses/<uuid:pk>/toggle/', admin_views.toggle_business_active, name='admin-toggle-business'),
    path('users/<uuid:pk>/toggle/', admin_views.toggle_user_active, name='admin-toggle-user'),
    path('create-business/', admin_views.create_business_for_user, name='admin-create-business'),
    path('businesses/<uuid:business_pk>/assign-role/', admin_views.assign_business_role, name='admin-assign-role'),
]
