from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from .models import Invoice
from .serializers import InvoiceSerializer, CreateInvoiceSerializer
from .services import InvoiceService
from .permissions import IsInvoiceMember
from apps.sales.models import Sale
from apps.orders.models import Order
from apps.customers.models import Customer
from apps.core.exceptions import success_response


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsInvoiceMember]
    filterset_fields = ['status', 'payment_method']
    search_fields = ['invoice_number', 'customer__name']
    ordering_fields = ['total', 'created_at', 'invoice_number']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Invoice.objects.filter(is_deleted=False).select_related('sale', 'order', 'customer', 'business')
        if business:
            return Invoice.objects.filter(
                business=business, is_deleted=False
            ).select_related('sale', 'order', 'customer', 'business')
        return Invoice.objects.none()

    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        business = getattr(request, 'business', None)
        if not business:
            return success_response(message='Business context required', status_code=400)
        sale = None
        if data.get('sale_id'):
            sale = Sale.objects.filter(id=data['sale_id'], business=business).first()
        order = None
        if data.get('order_id'):
            order = Order.objects.filter(id=data['order_id'], business=business).first()
        customer = None
        if data.get('customer_id'):
            customer = Customer.objects.filter(id=data['customer_id'], business=business).first()
        invoice = InvoiceService.generate_invoice(
            business=business, sale=sale, order=order,
            customer=customer, notes=data.get('notes', ''),
        )
        return success_response(
            data=InvoiceSerializer(invoice).data,
            message='Invoice generated',
            status_code=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_buffer = InvoiceService.generate_pdf(invoice)
        if pdf_buffer:
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            return response
        return success_response(message='PDF generation requires weasyprint', status_code=501)

    @action(detail=True, methods=['get'], url_path='print')
    def print_view(self, request, pk=None):
        invoice = self.get_object()
        return success_response(data=InvoiceSerializer(invoice).data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
