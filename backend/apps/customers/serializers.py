from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = (
            'id', 'business', 'name', 'phone', 'email', 'address',
            'notes', 'total_spent', 'total_orders', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'total_spent', 'total_orders', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs
