from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='')
    business_name = serializers.CharField(source='business.name', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = (
            'id', 'business', 'business_name', 'invoice_number', 'sale', 'order',
            'customer', 'customer_name', 'items', 'subtotal', 'discount',
            'tax', 'total', 'payment_method', 'status', 'notes', 'due_date',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'business', 'invoice_number', 'subtotal', 'total',
            'created_at', 'updated_at',
        )


class CreateInvoiceSerializer(serializers.Serializer):
    sale_id = serializers.UUIDField(required=False, allow_null=True)
    order_id = serializers.UUIDField(required=False, allow_null=True)
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, default='')
