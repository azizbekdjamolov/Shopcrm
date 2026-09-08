from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import Order
from .serializers import (
    OrderSerializer,
    CreateOrderSerializer,
    OrderStatusUpdateSerializer,
)
from .services import OrderService
from .permissions import IsOrderMember
from apps.customers.models import Customer
from apps.businesses.models import Branch, Business
from apps.products.models import Product
from apps.core.exceptions import success_response
from apps.audit.services import AuditService


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsOrderMember]
    filterset_fields = ['status', 'payment_method', 'payment_status', 'customer', 'branch']
    search_fields = ['order_number', 'delivery_address', 'delivery_phone']
    ordering_fields = ['total', 'created_at', 'status']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Order.objects.filter(is_deleted=False).select_related(
                'customer', 'branch'
            ).prefetch_related('items__product')
        if business:
            return Order.objects.filter(
                business=business, is_deleted=False
            ).select_related('customer', 'branch').prefetch_related('items__product')
        return Order.objects.none()

    @staticmethod
    def _get_or_create_buyer(user, business):
        from apps.businesses.models import BusinessUser
        is_member = BusinessUser.objects.filter(
            user=user, business=business, is_active=True
        ).exists()
        if is_member:
            return None
        profile = Customer.objects.filter(
            user=user, business=business, is_deleted=False
        ).first()
        if profile:
            return profile
        name = user.get_full_name() or user.email.split('@')[0]
        return Customer.objects.create(
            user=user,
            business=business,
            name=name,
            phone=getattr(user, 'phone', '') or '',
            email=user.email,
        )

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        business = getattr(request, 'business', None)
        if not business and request.data.get('business_id'):
            business = Business.objects.filter(
                id=request.data.get('business_id'), is_active=True
            ).first()
        if not business:
            return success_response(message='Business context required', status_code=400)
        customer = None
        if data.get('customer_id'):
            customer = get_object_or_404(Customer, id=data['customer_id'], business=business)
        elif request.user.is_authenticated:
            customer = self._get_or_create_buyer(request.user, business)
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
            })
        delivery_phone = data.get('delivery_phone', '')
        if delivery_phone:
            if customer and not customer.phone:
                customer.phone = delivery_phone
                customer.save(update_fields=['phone'])
            if request.user.is_authenticated and not request.user.phone:
                request.user.phone = delivery_phone
                request.user.save(update_fields=['phone'])
        try:
            order = OrderService.create_order(
                business=business,
                items_data=items_data,
                customer=customer,
                branch=branch,
                delivery_address=data.get('delivery_address', ''),
                delivery_phone=delivery_phone,
                delivery_notes=data.get('delivery_notes', ''),
                delivery_fee=data.get('delivery_fee', 0),
                discount=data.get('discount', 0),
                payment_method=data.get('payment_method', 'cash'),
            )
            AuditService.log_create(request.user, order, business=business,
                                    ip_address=getattr(request, '_ip_address', ''),
                                    user_agent=getattr(request, '_user_agent', ''))
            return success_response(
                data=OrderSerializer(order).data,
                message='Order created successfully',
                status_code=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated_order = OrderService.update_status(
                order, serializer.validated_data['status']
            )
            return success_response(
                data=OrderSerializer(updated_order).data,
                message=f'Order status updated to {updated_order.status}',
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        try:
            cancelled_order = OrderService.cancel_order(order, reason)
            return success_response(
                data=OrderSerializer(cancelled_order).data,
                message='Order cancelled',
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='track')
    def track(self, request):
        order_number = (
            request.query_params.get('order_number')
            or request.query_params.get('search')
            or ''
        ).strip()
        if not order_number:
            return success_response(message='Order number required', status_code=400)
        order = Order.objects.filter(
            order_number=order_number, is_deleted=False
        ).select_related('customer', 'branch').prefetch_related('items__product').first()
        if not order:
            return success_response(message='Order not found', status_code=404)
        return success_response(data=OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='my')
    def my(self, request):
        user = request.user
        if not user.is_authenticated:
            return success_response(data=[], message='Unauthenticated', status_code=401)
        if user.is_platform_admin:
            queryset = Order.objects.filter(is_deleted=False)
        elif user.owned_businesses.exists():
            queryset = Order.objects.filter(
                business__in=user.owned_businesses.filter(is_active=True),
                is_deleted=False,
            )
        else:
            queryset = Order.objects.filter(
                customer__user=user, is_deleted=False
            )
        queryset = queryset.select_related('customer', 'branch').prefetch_related('items__product')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        business = getattr(request, 'business', None)
        if business:
            active_statuses = [
                'NEW', 'CONFIRMED', 'PREPARING',
                'READY_FOR_DELIVERY', 'COURIER_ASSIGNED', 'ON_THE_WAY', 'ARRIVED'
            ]
            orders = Order.objects.filter(
                business=business,
                status__in=active_statuses,
                is_deleted=False,
            ).select_related('customer', 'branch').prefetch_related('items__product')
            page = self.paginate_queryset(orders)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(orders, many=True)
            return success_response(data=serializer.data)
        return success_response(data=[])

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
