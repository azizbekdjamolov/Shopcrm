import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class Debt(AbstractBusinessModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PARTIAL = 'partial', 'Partial'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'

    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.CASCADE, related_name='debts'
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Debt'
        verbose_name_plural = 'Debts'
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['business', 'customer']),
        ]

    def __str__(self):
        return f'Debt {self.customer.name} - {self.remaining_amount}'

    def save(self, *args, **kwargs):
        self.remaining_amount = self.total_amount - self.paid_amount
        if self.paid_amount <= 0:
            self.status = self.Status.PENDING
        elif self.paid_amount >= self.total_amount:
            self.status = self.Status.PAID
        else:
            self.status = self.Status.PARTIAL
        super().save(*args, **kwargs)

    @property
    def is_fully_paid(self):
        return self.paid_amount >= self.total_amount


class DebtTransaction(AbstractBusinessModel):
    class TransactionType(models.TextChoices):
        SALE = 'sale', 'Sale'
        PAYMENT = 'payment', 'Payment'

    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    reference_id = models.UUIDField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='debt_transactions'
    )

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Debt Transaction'
        verbose_name_plural = 'Debt Transactions'
        indexes = [
            models.Index(fields=['debt', 'transaction_type']),
        ]

    def __str__(self):
        return f'{self.transaction_type} - {self.amount} for {self.debt}'
