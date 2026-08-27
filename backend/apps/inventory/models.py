import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class Inventory(AbstractBusinessModel):
    product = models.OneToOneField(
        'products.Product', on_delete=models.CASCADE, related_name='inventory'
    )
    quantity = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=5)
    warehouse = models.CharField(max_length=255, blank=True, default='')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Inventory'
        verbose_name_plural = 'Inventories'

    def __str__(self):
        return f'{self.product.name} - {self.quantity}'

    @property
    def is_low_stock(self):
        return self.quantity <= self.minimum_stock

    @property
    def stock_value(self):
        return self.quantity * self.product.selling_price


class InventoryMovement(AbstractBusinessModel):
    class MovementType(models.TextChoices):
        PURCHASE = 'purchase', 'Purchase'
        SALE = 'sale', 'Sale'
        ADJUSTMENT = 'adjustment', 'Adjustment'
        TRANSFER = 'transfer', 'Transfer'
        RETURN = 'return', 'Return'

    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='inventory_movements'
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices, db_index=True)
    quantity = models.IntegerField()
    reference_id = models.UUIDField(null=True, blank=True)
    reference_model = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='inventory_movements'
    )

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Inventory Movement'
        verbose_name_plural = 'Inventory Movements'
        indexes = [
            models.Index(fields=['business', 'product', 'movement_type']),
            models.Index(fields=['business', 'created_at']),
        ]

    def __str__(self):
        return f'{self.movement_type} - {self.product.name} ({self.quantity})'
