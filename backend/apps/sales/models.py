import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel
from apps.core.utils import generate_sale_number


class Sale(AbstractBusinessModel):
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        CLICK = 'click', 'Click'
        PAYME = 'payme', 'Payme'
        DEBT = 'debt', 'Debt'

    class Status(models.TextChoices):
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales'
    )
    branch = models.ForeignKey(
        'businesses.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sales'
    )
    sale_number = models.CharField(max_length=50, unique=True, db_index=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED, db_index=True)
    notes = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Sale'
        verbose_name_plural = 'Sales'
        indexes = [
            models.Index(fields=['business', 'created_at']),
            models.Index(fields=['business', 'status']),
            models.Index(fields=['business', 'payment_method']),
        ]

    def __str__(self):
        return f'Sale {self.sale_number}'

    def save(self, *args, **kwargs):
        if not self.sale_number:
            self.sale_number = generate_sale_number()
        super().save(*args, **kwargs)

    @property
    def profit(self):
        items = self.items.all()
        total_cost = sum(item.quantity * item.product.purchase_price for item in items if item.product)
        return self.total - total_cost


class SaleItem(AbstractBusinessModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='sale_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Sale Item'
        verbose_name_plural = 'Sale Items'

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

    def save(self, *args, **kwargs):
        self.total = (self.unit_price * self.quantity) - self.discount
        super().save(*args, **kwargs)
