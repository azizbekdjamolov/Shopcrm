import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class Notification(AbstractBusinessModel):
    class Type(models.TextChoices):
        ORDER = 'order', 'Order'
        PAYMENT = 'payment', 'Payment'
        STOCK = 'stock', 'Stock'
        DEBT = 'debt', 'Debt'
        DELIVERY = 'delivery', 'Delivery'
        SYSTEM = 'system', 'System'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM, db_index=True)
    reference_model = models.CharField(max_length=100, blank=True, default='')
    reference_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['business', 'type']),
        ]

    def __str__(self):
        return f'{self.title} - {self.user}'


class NotificationPreference(AbstractBusinessModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences'
    )
    notification_type = models.CharField(max_length=20, choices=Notification.Type.choices)
    in_app_enabled = models.BooleanField(default=True)
    telegram_enabled = models.BooleanField(default=False)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
        unique_together = ('user', 'notification_type')

    def __str__(self):
        return f'{self.user} - {self.notification_type}'
