from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'unit_price', 'total')
        read_only_fields = ('id', 'total')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='')
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')

    class Meta:
        model = Order
        fields = (
            'id', 'business', 'customer', 'customer_name', 'branch', 'branch_name',
            'order_number', 'status', 'subtotal', 'delivery_fee', 'discount', 'total',
            'delivery_address', 'delivery_phone', 'delivery_notes',
            'payment_method', 'payment_status', 'items',
            'confirmed_at', 'delivered_at', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'business', 'order_number', 'subtotal', 'total',
            'confirmed_at', 'delivered_at', 'created_at', 'updated_at',
        )


class CreateOrderSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    items = OrderItemSerializer(many=True, write_only=True)
    delivery_address = serializers.CharField(required=False, default='')
    delivery_phone = serializers.CharField(required=False, default='')
    delivery_notes = serializers.CharField(required=False, default='')
    delivery_fee = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices, default='cash'
    )

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    notes = serializers.CharField(required=False, default='')
