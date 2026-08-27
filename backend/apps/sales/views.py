from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import Sale
from .serializers import SaleSerializer, CreateSaleSerializer
from .services import SaleService
from .permissions import IsSaleMember
from apps.customers.models import Customer
from apps.businesses.models import Branch
from apps.products.models import Product
from apps.core.exceptions import success_response
from apps.audit.services import AuditService


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated, IsSaleMember]
    filterset_fields = ['status', 'payment_method', 'seller', 'customer', 'branch']
    search_fields = ['sale_number', 'customer__name', 'notes']
    ordering_fields = ['total', 'created_at', 'sale_number']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Sale.objects.filter(is_deleted=False).select_related(
                'customer', 'branch', 'seller'
            ).prefetch_related('items__product')
        if business:
            return Sale.objects.filter(
                business=business, is_deleted=False
            ).select_related('customer', 'branch', 'seller').prefetch_related('items__product')
        return Sale.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = CreateSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        business = getattr(request, 'business', None)
        if not business:
            return success_response(message='Business context required', status_code=400)
        customer = None
        if data.get('customer_id'):
            customer = get_object_or_404(Customer, id=data['customer_id'], business=business)
        branch = None
        if data.get('branch_id'):
            branch = get_object_or_404(Branch, id=data['branch_id'], business=business)
        items_data = []
        for item in data['items']:
            product = get_object_or_404(Product, id=item['product'].id, business=business)
            items_data.append({
                'product': product,
                'quantity': item['quantity'],
                'unit_price': item.get('unit_price', product.selling_price),
                'discount': item.get('discount', 0),
            })
        try:
            sale = SaleService.create_sale(
                business=business,
                seller=request.user,
                items_data=items_data,
                customer=customer,
                branch=branch,
                discount=data.get('discount', 0),
                tax=data.get('tax', 0),
                payment_method=data.get('payment_method', 'cash'),
                notes=data.get('notes', ''),
            )
            AuditService.log_create(request.user, sale, business=business,
                                    ip_address=getattr(request, '_ip_address', ''),
                                    user_agent=getattr(request, '_user_agent', ''))
            return success_response(
                data=SaleSerializer(sale).data,
                message='Sale created successfully',
                status_code=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        sale = self.get_object()
        if sale.status == Sale.Status.CANCELLED:
            return success_response(message='Sale is already cancelled', status_code=400)
        sale.status = Sale.Status.CANCELLED
        sale.save(update_fields=['status', 'updated_at'])
        for item in sale.items.select_related('product').all():
            from apps.inventory.services import InventoryService
            InventoryService.add_stock(
                business=sale.business,
                product=item.product,
                quantity=item.quantity,
                user=request.user,
                reference_id=sale.id,
                reference_model='Sale',
                notes=f'Cancelled sale {sale.sale_number}',
            )
        return success_response(data=SaleSerializer(sale).data, message='Sale cancelled')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
