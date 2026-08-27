from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='')

    class Meta:
        model = Payment
        fields = (
            'id', 'business', 'order', 'sale', 'customer', 'customer_name',
            'amount', 'payment_method', 'provider', 'provider_transaction_id',
            'status', 'callback_data', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'provider_transaction_id', 'callback_data', 'created_at', 'updated_at')


class ProcessPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    payment_method = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    provider = serializers.ChoiceField(choices=Payment.Provider.choices, default='other')
    order_id = serializers.UUIDField(required=False, allow_null=True)
    sale_id = serializers.UUIDField(required=False, allow_null=True)
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    callback_url = serializers.URLField(required=False, default='')


class WebhookSerializer(serializers.Serializer):
    payload = serializers.DictField()
    signature = serializers.CharField(required=False, default='')
