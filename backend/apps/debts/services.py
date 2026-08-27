from django.db import transaction

from .models import Debt, DebtTransaction
from apps.customers.models import Customer


class DebtService:

    @staticmethod
    @transaction.atomic
    def add_debt(business, customer, amount, reference_id=None, notes='', created_by=None):
        existing_debt = Debt.objects.filter(
            business=business,
            customer=customer,
            status__in=[Debt.Status.PENDING, Debt.Status.PARTIAL, Debt.Status.OVERDUE],
        ).first()

        if existing_debt:
            existing_debt.total_amount += amount
            existing_debt.remaining_amount = existing_debt.total_amount - existing_debt.paid_amount
            existing_debt.save(update_fields=['total_amount', 'remaining_amount', 'updated_at'])
            debt = existing_debt
        else:
            debt = Debt.objects.create(
                business=business,
                customer=customer,
                total_amount=amount,
                remaining_amount=amount,
            )

        DebtTransaction.objects.create(
            business=business,
            debt=debt,
            amount=amount,
            transaction_type=DebtTransaction.TransactionType.SALE,
            reference_id=reference_id,
            notes=notes,
            created_by=created_by,
        )

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_debt_overdue(business, debt)
        except Exception:
            pass

        return debt

    @staticmethod
    @transaction.atomic
    def make_payment(business, debt, amount, created_by=None, notes=''):
        if amount <= 0:
            raise ValueError('Payment amount must be positive')
        if debt.remaining_amount <= 0:
            raise ValueError('This debt is already fully paid')

        actual_amount = min(amount, debt.remaining_amount)
        debt.paid_amount += actual_amount
        debt.save(update_fields=['paid_amount', 'updated_at'])

        DebtTransaction.objects.create(
            business=business,
            debt=debt,
            amount=actual_amount,
            transaction_type=DebtTransaction.TransactionType.PAYMENT,
            notes=notes or 'Payment received',
            created_by=created_by,
        )

        if debt.customer:
            debt.customer.total_spent = max(0, debt.customer.total_spent - actual_amount)
            debt.customer.save(update_fields=['total_spent', 'updated_at'])

        return debt

    @staticmethod
    def get_remaining(business, customer):
        debts = Debt.objects.filter(
            business=business,
            customer=customer,
            status__in=[Debt.Status.PENDING, Debt.Status.PARTIAL, Debt.Status.OVERDUE],
        )
        return sum(debt.remaining_amount for debt in debts)

    @staticmethod
    def get_customer_debts(business, customer):
        return Debt.objects.filter(
            business=business, customer=customer, is_deleted=False
        ).select_related('customer').prefetch_related('transactions')
