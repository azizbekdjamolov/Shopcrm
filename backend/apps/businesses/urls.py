from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.BusinessViewSet, basename='business')

urlpatterns = [
    path('marketplace-settings/', views.BusinessMarketplaceSettingsView.as_view({
        'get': 'list',
        'put': 'update',
        'patch': 'update',
    }), name='marketplace-settings'),
    path('<uuid:business_pk>/branches/', views.BranchViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='business-branches-list'),
    path('<uuid:business_pk>/branches/<uuid:pk>/', views.BranchViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }), name='business-branches-detail'),
    path('<uuid:business_pk>/members/', views.BusinessUserViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='business-members-list'),
    path('<uuid:business_pk>/members/<uuid:pk>/', views.BusinessUserViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }), name='business-members-detail'),
    path('', include(router.urls)),
]
