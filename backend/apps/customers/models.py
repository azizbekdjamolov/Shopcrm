import uuid
from django.db import models
from apps.core.models import AbstractBusinessModel


class Customer(AbstractBusinessModel):
    name = models.CharField(max_length=255, db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='', db_index=True)
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        indexes = [
            models.Index(fields=['business', 'name']),
            models.Index(fields=['business', 'phone']),
        ]

    def __str__(self):
        return f'{self.name} ({self.business.name})'
