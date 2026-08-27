from rest_framework import viewsets, permissions
from rest_framework.decorators import action

from .services import ReportService
from .serializers import ReportRequestSerializer
from .permissions import IsReportMember
from apps.core.exceptions import success_response


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_business(self, request):
        business = getattr(request, 'business', None)
        return business

    @action(detail=False, methods=['get'])
    def sales(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={
                'total_sales': 0, 'total_orders': 0, 'total_items': 0,
                'average_order_value': 0, 'sales_by_date': [], 'top_products': [],
            })
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.sales_report(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            branch_id=data.get('branch_id'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def profit(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={
                'total_revenue': 0, 'total_cost': 0, 'gross_profit': 0,
                'profit_margin': 0, 'profit_by_date': [],
            })
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.profit_report(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            branch_id=data.get('branch_id'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def expenses(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={
                'total_expenses': 0, 'expenses_by_category': [], 'expenses_by_date': [],
            })
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.expense_report(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            branch_id=data.get('branch_id'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def inventory(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={
                'total_products': 0, 'total_stock_value': 0, 'low_stock_count': 0, 'out_of_stock_count': 0,
            })
        report = ReportService.inventory_report(business=business)
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def debts(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={
                'total_debts': 0, 'active_debts': 0, 'paid_debts': 0,
            })
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.debt_report(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def employee_performance(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={'employees': []})
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.employee_performance(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def courier_performance(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={'couriers': []})
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.courier_performance(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def branch_performance(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={'branches': []})
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.branch_performance(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )
        return success_response(data=report)

    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        business = self._get_business(request)
        if not business:
            return success_response(data={'products': []})
        serializer = ReportRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.product_performance(
            business=business,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )
        return success_response(data=report)
