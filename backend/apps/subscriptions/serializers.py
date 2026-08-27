from rest_framework import serializers
from .models import SubscriptionPlan, Subscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = (
            'id', 'name', 'slug', 'price', 'interval', 'features',
            'max_users', 'max_branches', 'has_telegram', 'has_api',
            'has_advanced_reports', 'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True, default='')
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = (
            'id', 'business', 'business_name', 'plan', 'plan_name',
            'status', 'starts_at', 'ends_at', 'auto_renew', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')


class CreateSubscriptionSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    auto_renew = serializers.BooleanField(default=True)
