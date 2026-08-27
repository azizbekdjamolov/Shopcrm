import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class ExpenseCategory(AbstractBusinessModel):
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Expense Category'
        verbose_name_plural = 'Expense Categories'

    def __str__(self):
        return self.name


class Expense(AbstractBusinessModel):
    category = models.ForeignKey(
        ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, default='')
    date = models.DateField(db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='expenses'
    )
    branch = models.ForeignKey(
        'businesses.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses'
    )
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        indexes = [
            models.Index(fields=['business', 'date']),
            models.Index(fields=['business', 'category']),
        ]

    def __str__(self):
        return f'{self.description or "Expense"} - {self.amount}'
