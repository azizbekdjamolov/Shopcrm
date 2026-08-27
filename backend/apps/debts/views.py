from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action

from .models import Debt, DebtTransaction
from .serializers import DebtSerializer, MakePaymentSerializer, DebtTransactionSerializer
from .services import DebtService
from .permissions import IsDebtMember
from apps.core.exceptions import success_response


class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [permissions.IsAuthenticated, IsDebtMember]
    filterset_fields = ['status', 'customer']
    search_fields = ['customer__name']
    ordering_fields = ['total_amount', 'remaining_amount', 'created_at', 'due_date']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Debt.objects.filter(is_deleted=False).select_related('customer').prefetch_related('transactions__created_by')
        if business:
            return Debt.objects.filter(
                business=business, is_deleted=False
            ).select_related('customer').prefetch_related('transactions__created_by')
        return Debt.objects.none()

    @action(detail=True, methods=['post'], url_path='pay')
    def make_payment(self, request, pk=None):
        debt = self.get_object()
        serializer = MakePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated_debt = DebtService.make_payment(
                business=debt.business,
                debt=debt,
                amount=serializer.validated_data['amount'],
                created_by=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )
            return success_response(
                data=DebtSerializer(updated_debt).data,
                message='Payment recorded successfully',
            )
        except ValueError as e:
            return success_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        debt = self.get_object()
        transactions = debt.transactions.select_related('created_by').order_by('-created_at')
        serializer = DebtTransactionSerializer(transactions, many=True)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        business = getattr(request, 'business', None)
        if business:
            debts = Debt.objects.filter(
                business=business, status=Debt.Status.OVERDUE, is_deleted=False
            ).select_related('customer')
            serializer = DebtSerializer(debts, many=True)
            return success_response(data=serializer.data)
        return success_response(data=[])

    @action(detail=False, methods=['get'])
    def summary(self, request):
        business = getattr(request, 'business', None)
        if business:
            debts = Debt.objects.filter(business=business, is_deleted=False)
            total_debt = sum(d.total_amount for d in debts)
            total_paid = sum(d.paid_amount for d in debts)
            total_remaining = sum(d.remaining_amount for d in debts)
            return success_response(data={
                'total_debt': str(total_debt),
                'total_paid': str(total_paid),
                'total_remaining': str(total_remaining),
                'pending_count': debts.filter(status=Debt.Status.PENDING).count(),
                'partial_count': debts.filter(status=Debt.Status.PARTIAL).count(),
                'overdue_count': debts.filter(status=Debt.Status.OVERDUE).count(),
            })
        return success_response(data={})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
