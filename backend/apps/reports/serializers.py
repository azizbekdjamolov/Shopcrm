from rest_framework import serializers


class ReportRequestSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    branch_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        if 'start_date' in attrs and 'end_date' in attrs:
            if attrs['start_date'] and attrs['end_date']:
                if attrs['start_date'] > attrs['end_date']:
                    raise serializers.ValidationError('start_date must be before end_date')
        return attrs


class SalesReportSerializer(serializers.Serializer):
    period = serializers.DictField()
    summary = serializers.DictField()
    payment_methods = serializers.ListField()
    daily_sales = serializers.ListField()


class ProfitReportSerializer(serializers.Serializer):
    period = serializers.DictField()
    revenue = serializers.CharField()
    cost_of_goods = serializers.CharField()
    profit = serializers.CharField()
    profit_margin = serializers.FloatField()


class ExpenseReportSerializer(serializers.Serializer):
    period = serializers.DictField()
    total_expenses = serializers.CharField()
    by_category = serializers.ListField()
    daily_expenses = serializers.ListField()


class InventoryReportSerializer(serializers.Serializer):
    total_items = serializers.IntegerField()
    total_stock_value = serializers.CharField()
    low_stock_count = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    low_stock_products = serializers.ListField()


class DebtReportSerializer(serializers.Serializer):
    period = serializers.DictField()
    total_debt = serializers.CharField()
    total_paid = serializers.CharField()
    total_remaining = serializers.CharField()
    by_status = serializers.ListField()
