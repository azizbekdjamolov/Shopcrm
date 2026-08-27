from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Supplier, Product
from .serializers import (
    CategorySerializer,
    SupplierSerializer,
    ProductSerializer,
    ProductListSerializer,
)
from .permissions import IsProductMember
from apps.core.exceptions import success_response
from apps.audit.services import AuditService


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsProductMember]
    filterset_fields = ['is_active', 'parent']
    search_fields = ['name', 'description']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Category.objects.filter(is_deleted=False)
        if business:
            return Category.objects.filter(business=business, is_deleted=False)
        return Category.objects.none()

    def perform_create(self, serializer):
        business = getattr(self.request, 'business', None)
        if business:
            instance = serializer.save(business=business)
        else:
            instance = serializer.save()
        AuditService.log_create(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsProductMember]
    filterset_fields = ['business']
    search_fields = ['name', 'phone', 'email', 'company']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Supplier.objects.filter(is_deleted=False)
        if business:
            return Supplier.objects.filter(business=business, is_deleted=False)
        return Supplier.objects.none()

    def perform_create(self, serializer):
        business = getattr(self.request, 'business', None)
        if business:
            instance = serializer.save(business=business)
        else:
            instance = serializer.save()
        AuditService.log_create(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsProductMember]
    filterset_fields = ['status', 'category', 'supplier']
    search_fields = ['name', 'barcode', 'description']
    ordering_fields = ['name', 'selling_price', 'quantity', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Product.objects.filter(is_deleted=False).select_related('category', 'supplier')
        if business:
            return Product.objects.filter(
                business=business, is_deleted=False
            ).select_related('category', 'supplier')
        return Product.objects.none()

    def perform_create(self, serializer):
        business = getattr(self.request, 'business', None)
        if business:
            instance = serializer.save(business=business)
        else:
            instance = serializer.save()
        AuditService.log_create(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))

    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {f.name: str(getattr(instance, f.name)) for f in instance._meta.fields}
        business = getattr(self.request, 'business', None)
        updated = serializer.save()
        AuditService.log_update(self.request.user, updated, old_values, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))

    def perform_destroy(self, instance):
        business = getattr(self.request, 'business', None)
        AuditService.log_delete(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted', 'updated_at'])

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        business = getattr(request, 'business', None)
        if business:
            products = Product.objects.filter(
                business=business, is_deleted=False
            ).select_related('category', 'supplier')
            low_stock_products = [p for p in products if p.is_low_stock]
            serializer = ProductListSerializer(low_stock_products, many=True)
            return success_response(data=serializer.data)
        return success_response(data=[])

    @action(detail=False, methods=['get'], url_path='barcode/(?P<barcode>[^/]+)')
    def barcode_lookup(self, request, barcode=None, pk=None):
        business = getattr(request, 'business', None)
        if business:
            product = Product.objects.filter(
                business=business, barcode=barcode, is_deleted=False, status='active'
            ).select_related('category', 'supplier').first()
        else:
            product = Product.objects.filter(
                barcode=barcode, is_deleted=False, status='active'
            ).select_related('category', 'supplier').first()
        if product:
            serializer = ProductSerializer(product, context={'request': request})
            return success_response(data=serializer.data)
        return success_response(message='Product not found', status_code=404)

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        business = getattr(request, 'business', None)
        if business:
            products = Product.objects.filter(
                business=business, quantity=0, is_deleted=False
            ).select_related('category', 'supplier')
            serializer = ProductListSerializer(products, many=True)
            return success_response(data=serializer.data)
        return success_response(data=[])
