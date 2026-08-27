from rest_framework import serializers
from .models import Delivery, CourierRating


class DeliverySerializer(serializers.ModelSerializer):
    courier_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Delivery
        fields = (
            'id', 'business', 'order', 'order_number', 'courier', 'courier_name',
            'status', 'assigned_at', 'picked_up_at', 'delivered_at', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'assigned_at', 'created_at', 'updated_at')

    def get_courier_name(self, obj):
        if obj.courier:
            return obj.courier.get_full_name() or obj.courier.email
        return None


class CourierRatingSerializer(serializers.ModelSerializer):
    courier_name = serializers.SerializerMethodField()

    class Meta:
        model = CourierRating
        fields = (
            'id', 'business', 'delivery', 'courier', 'courier_name',
            'customer', 'rating', 'comment', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def get_courier_name(self, obj):
        if obj.courier:
            return obj.courier.get_full_name() or obj.courier.email
        return None

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value


class AssignCourierSerializer(serializers.Serializer):
    courier_id = serializers.UUIDField()
    order_id = serializers.UUIDField()


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Delivery.Status.choices)
    notes = serializers.CharField(required=False, default='')
