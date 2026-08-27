from rest_framework import serializers
from .models import ExpenseCategory, Expense


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ('id', 'business', 'name', 'icon', 'created_at', 'updated_at')
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    created_by_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')

    class Meta:
        model = Expense
        fields = (
            'id', 'business', 'category', 'category_name', 'amount', 'description',
            'date', 'created_by', 'created_by_name', 'branch', 'branch_name',
            'receipt_image', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_by', 'created_at', 'updated_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs
