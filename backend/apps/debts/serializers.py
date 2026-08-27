from rest_framework import serializers
from .models import Debt, DebtTransaction


class DebtTransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DebtTransaction
        fields = (
            'id', 'business', 'debt', 'amount', 'transaction_type',
            'reference_id', 'notes', 'created_by', 'created_by_name', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_by', 'created_at', 'updated_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None


class DebtSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    transactions = DebtTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Debt
        fields = (
            'id', 'business', 'customer', 'customer_name', 'total_amount',
            'paid_amount', 'remaining_amount', 'status', 'due_date',
            'transactions', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'paid_amount', 'remaining_amount', 'status', 'created_at', 'updated_at')


class MakePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    notes = serializers.CharField(required=False, default='')
