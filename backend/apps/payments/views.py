from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Payment
from .serializers import (
    PaymentSerializer,
    ProcessPaymentSerializer,
    WebhookSerializer,
)
from .services import PaymentService
from .providers import PaymentProviderFactory
from .permissions import IsPaymentMember
from apps.orders.models import Order
from apps.sales.models import Sale
from apps.customers.models import Customer
from apps.businesses.models import Business
from apps.core.exceptions import success_response


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPaymentMember]
    filterset_fields = ['status', 'payment_method', 'provider']
    search_fields = ['provider_transaction_id']
    ordering_fields = ['amount', 'created_at']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Payment.objects.filter(is_deleted=False).select_related('order', 'sale', 'customer')
        if business:
            return Payment.objects.filter(
                business=business, is_deleted=False
            ).select_related('order', 'sale', 'customer')
        return Payment.objects.none()

    @action(detail=False, methods=['post'])
    def process(self, request):
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        business = getattr(request, 'business', None)
        if not business:
            return success_response(message='Business context required', status_code=400)
        order = None
        if data.get('order_id'):
            order = Order.objects.filter(id=data['order_id'], business=business).first()
        sale = None
        if data.get('sale_id'):
            sale = Sale.objects.filter(id=data['sale_id'], business=business).first()
        customer = None
        if data.get('customer_id'):
            customer = Customer.objects.filter(id=data['customer_id'], business=business).first()
        result = PaymentService.process_payment(
            business=business,
            amount=data['amount'],
            payment_method=data['payment_method'],
            provider_name=data.get('provider', 'other'),
            order=order,
            sale=sale,
            customer=customer,
            callback_url=data.get('callback_url', ''),
        )
        return success_response(data=result)

    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        payment = self.get_object()
        if payment.status == Payment.Status.PAID:
            return success_response(data={'verified': True, 'status': payment.status})
        return success_response(data={'verified': False, 'status': payment.status})

    @action(detail=False, methods=['post'], url_path='webhook/(?P<provider>[a-z]+)')
    def webhook(self, request, provider=None):
        serializer = WebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = PaymentService.verify_webhook(
            provider,
            serializer.validated_data['payload'],
            serializer.validated_data.get('signature', ''),
        )
        if not result.get('verified'):
            return success_response(message='Invalid signature', status_code=403)
        callback_result = PaymentService.handle_callback(provider, serializer.validated_data['payload'])
        return success_response(data=callback_result)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def click_callback(request):
    """Handle Click payment callback"""
    data = request.data
    business_id = data.get('merchant_trans_id', '').split('-')[0] if data.get('merchant_trans_id') else None

    if not business_id:
        return Response({'error': 'Invalid request'}, status=400)

    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business not found'}, status=404)

    provider = PaymentProviderFactory.get_provider('click', business)
    if not provider:
        return Response({'error': 'Provider not configured'}, status=400)

    result = provider.handle_callback(data)
    if result['status'] == 'success':
        PaymentService.process_callback(business, 'click', result)

    return Response(result)


@api_view(['POST'])
@permission_classes([AllowAny])
def payme_callback(request):
    """Handle Payme payment callback"""
    data = request.data
    method = data.get('method', '')

    if method in ('CheckPerformTransaction', 'CheckTransaction'):
        return Response({'result': {'allow': True}})

    if method in ('CreateTransaction', 'PerformTransaction', 'CancelTransaction'):
        params = data.get('params', {})
        account = params.get('account', {})
        order_id = account.get('order_id', '')
        business_id = order_id.split('-')[0] if order_id else None

        if not business_id:
            return Response({'error': {'code': -1, 'message': 'Invalid order'}}, status=200)

        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response({'error': {'code': -1, 'message': 'Business not found'}}, status=200)

        provider = PaymentProviderFactory.get_provider('payme', business)
        if not provider:
            return Response({'error': {'code': -1, 'message': 'Provider not configured'}}, status=200)

        result = provider.handle_callback(data)
        if result['status'] == 'success':
            PaymentService.process_callback(business, 'payme', result)

        return Response({'result': result})

    return Response({'error': {'code': -3, 'message': 'Method not found'}}, status=200)
