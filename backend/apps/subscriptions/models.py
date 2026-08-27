import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel, AbstractTimestampedModel


class SubscriptionPlan(AbstractTimestampedModel):
    class Interval(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'
        YEARLY = 'yearly', 'Yearly'

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    interval = models.CharField(max_length=20, choices=Interval.choices, default=Interval.MONTHLY)
    features = models.JSONField(default=list, blank=True)
    max_users = models.PositiveIntegerField(default=5)
    max_branches = models.PositiveIntegerField(default=2)
    has_telegram = models.BooleanField(default=False)
    has_api = models.BooleanField(default=False)
    has_advanced_reports = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta(AbstractTimestampedModel.Meta):
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'

    def __str__(self):
        return f'{self.name} - {self.price}/{self.interval}'


class Subscription(AbstractBusinessModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'

    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.CASCADE, related_name='subscriptions'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
        indexes = [
            models.Index(fields=['business', 'status']),
        ]

    def __str__(self):
        return f'{self.business.name} - {self.plan.name}'

    @property
    def is_active(self):
        from django.utils import timezone
        return self.status == self.Status.ACTIVE and self.ends_at > timezone.now()
