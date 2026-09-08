from rest_framework import serializers
from .models import Sale, SaleItem
from apps.products.models import Product


class OptionalUUIDField(serializers.UUIDField):
    def to_internal_value(self, data):
        if data in ('', 'default', None):
            return None
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            return None


class CreateSaleItemSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source='product', queryset=Product.objects.all()
    )
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    discount = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = (
            'id', 'product', 'product_name', 'quantity', 'unit_price',
            'discount', 'total',
        )
        read_only_fields = ('id', 'total')


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    seller_name = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='')
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')
    profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = (
            'id', 'business', 'customer', 'customer_name', 'branch', 'branch_name',
            'seller', 'seller_name', 'sale_number', 'subtotal', 'discount',
            'tax', 'total', 'payment_method', 'status', 'notes',
            'items', 'profit', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'business', 'seller', 'sale_number', 'subtotal', 'total',
            'created_at', 'updated_at',
        )

    def get_seller_name(self, obj):
        if obj.seller:
            return obj.seller.get_full_name() or obj.seller.email
        return None


class CreateSaleSerializer(serializers.Serializer):
    customer_id = OptionalUUIDField(required=False, allow_null=True)
    user_id = OptionalUUIDField(required=False, allow_null=True)
    branch_id = OptionalUUIDField(required=False, allow_null=True)
    items = CreateSaleItemSerializer(many=True, write_only=True)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices, default='cash')
    notes = serializers.CharField(required=False, default='')

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value
