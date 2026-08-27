from django.urls import path
from . import marketplace_views

urlpatterns = [
    path('stores/', marketplace_views.public_store_list, name='public-stores'),
    path('stores/<uuid:business_id>/', marketplace_views.public_store_detail, name='public-store-detail'),
    path('stores/<uuid:business_id>/products/', marketplace_views.public_store_products, name='public-store-products'),
]
