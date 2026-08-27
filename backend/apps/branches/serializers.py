from rest_framework import serializers
from .models import BranchSettings
from apps.businesses.models import Branch


class BranchSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchSettings
        fields = (
            'id', 'branch', 'opening_time', 'closing_time',
            'max_orders_per_day', 'delivery_radius_km', 'min_order_amount',
            'free_delivery_threshold', 'is_delivery_enabled', 'is_pickup_enabled',
            'custom_message', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class BranchDetailSerializer(serializers.ModelSerializer):
    settings = BranchSettingsSerializer(read_only=True)

    class Meta:
        model = Branch
        fields = (
            'id', 'business', 'name', 'address', 'phone',
            'is_main', 'is_active', 'settings', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')
