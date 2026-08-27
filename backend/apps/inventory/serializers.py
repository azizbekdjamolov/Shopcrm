from rest_framework import serializers
from .models import Inventory, InventoryMovement


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    stock_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'id', 'business', 'product', 'product_name', 'quantity',
            'minimum_stock', 'warehouse', 'last_updated', 'is_low_stock', 'stock_value',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'last_updated', 'created_at', 'updated_at')


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryMovement
        fields = (
            'id', 'business', 'product', 'product_name', 'movement_type',
            'quantity', 'reference_id', 'reference_model', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_by', 'created_at', 'updated_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None


class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField()
    notes = serializers.CharField(required=False, default='')


class StockTransferSerializer(serializers.Serializer):
    from_product_id = serializers.UUIDField()
    to_product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, default='')
