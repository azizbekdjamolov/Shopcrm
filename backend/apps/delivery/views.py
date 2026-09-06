from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import Delivery, CourierRating
from .serializers import (
    DeliverySerializer,
    CourierRatingSerializer,
    AssignCourierSerializer,
    DeliveryStatusUpdateSerializer,
)
from .services import DeliveryService
from .permissions import IsDeliveryMember, IsCourier
from apps.orders.models import Order
from apps.accounts.models import User
from apps.core.exceptions import success_response


class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryMember]
    filterset_fields = ['status', 'courier']
    search_fields = ['order__order_number']
    ordering_fields = ['assigned_at', 'delivered_at']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Delivery.objects.filter(is_deleted=False).select_related('order', 'courier')
        if business:
            queryset = Delivery.objects.filter(
                business=business, is_deleted=False
            ).select_related('order', 'courier')
            if self.request.user.role == 'courier' and not self.request.user.is_platform_admin:
                queryset = queryset.filter(courier=self.request.user)
            return queryset
        return Delivery.objects.none()

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        serializer = AssignCourierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = getattr(request, 'business', None)
        order = get_object_or_404(Order, id=serializer.validated_data['order_id'], business=business)
        courier = get_object_or_404(User, id=serializer.validated_data['courier_id'])
        try:
            delivery = DeliveryService.assign_courier(business, order, courier)
            return success_response(
                data=DeliverySerializer(delivery).data,
                message='Courier assigned',
                status_code=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_delivery_status(self, request, pk=None):
        delivery = self.get_object()
        serializer = DeliveryStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = DeliveryService.update_status(delivery, serializer.validated_data['status'])
            return success_response(
                data=DeliverySerializer(updated).data,
                message=f'Delivery status updated to {updated.status}',
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        delivery = self.get_object()
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        try:
            courier_rating = DeliveryService.rate_courier(delivery, request.user, rating, comment)
            return success_response(
                data=CourierRatingSerializer(courier_rating).data,
                message='Rating submitted',
                status_code=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='my')
    def my_deliveries(self, request):
        queryset = self.get_queryset()
        if not request.user.is_platform_admin:
            queryset = queryset.filter(courier=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class CourierRatingViewSet(viewsets.ModelViewSet):
    serializer_class = CourierRatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryMember]
    filterset_fields = ['courier', 'rating']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if business:
            return CourierRating.objects.filter(
                business=business, is_deleted=False
            ).select_related('courier', 'customer', 'delivery')
        return CourierRating.objects.none()

    def perform_create(self, serializer):
        business = getattr(self.request, 'business', None)
        if business:
            serializer.save(business=business)
        else:
            serializer.save()


class CourierDashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def list(self, request):
        courier = request.user
        stats = DeliveryService.get_courier_stats(courier)
        business = getattr(request, 'business', None)
        if business:
            active_deliveries = Delivery.objects.filter(
                business=business, courier=courier,
                status__in=['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'],
                is_deleted=False,
            ).select_related('order')
            stats['active_deliveries'] = DeliverySerializer(active_deliveries, many=True).data
            stats['active_count'] = active_deliveries.count()
        else:
            stats['active_deliveries'] = []
            stats['active_count'] = 0
        return success_response(data=stats)
