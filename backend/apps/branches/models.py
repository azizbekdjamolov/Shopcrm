from django.db import models
from apps.core.models import AbstractBusinessModel


class BranchSettings(AbstractBusinessModel):
    branch = models.OneToOneField(
        'businesses.Branch', on_delete=models.CASCADE, related_name='settings'
    )
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    max_orders_per_day = models.PositiveIntegerField(default=100)
    delivery_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    free_delivery_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_delivery_enabled = models.BooleanField(default=True)
    is_pickup_enabled = models.BooleanField(default=True)
    custom_message = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Branch Settings'
        verbose_name_plural = 'Branch Settings'

    def __str__(self):
        return f'Settings for {self.branch.name}'
