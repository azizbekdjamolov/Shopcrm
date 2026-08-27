import uuid
from django.db import models
from apps.core.models import AbstractBusinessModel
from apps.core.utils import generate_invoice_number


class Invoice(AbstractBusinessModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    sale = models.ForeignKey(
        'sales.Sale', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices'
    )
    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices'
    )
    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices'
    )
    items = models.JSONField(default=list, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True, default='')
    due_date = models.DateField(null=True, blank=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['business', 'created_at']),
        ]

    def __str__(self):
        return f'Invoice {self.invoice_number}'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number()
        super().save(*args, **kwargs)
