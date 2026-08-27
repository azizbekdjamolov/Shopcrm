import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class Delivery(AbstractBusinessModel):
    class Status(models.TextChoices):
        ASSIGNED = 'ASSIGNED', 'Assigned'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        ON_THE_WAY = 'ON_THE_WAY', 'On the Way'
        ARRIVED = 'ARRIVED', 'Arrived'
        DELIVERED = 'DELIVERED', 'Delivered'

    order = models.OneToOneField(
        'orders.Order', on_delete=models.CASCADE, related_name='delivery'
    )
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED, db_index=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Delivery'
        verbose_name_plural = 'Deliveries'
        indexes = [
            models.Index(fields=['courier', 'status']),
            models.Index(fields=['business', 'status']),
        ]

    def __str__(self):
        return f'Delivery for {self.order.order_number}'


class CourierRating(AbstractBusinessModel):
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='ratings')
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courier_ratings'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='given_ratings'
    )
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Courier Rating'
        verbose_name_plural = 'Courier Ratings'

    def __str__(self):
        return f'Rating {self.rating} for {self.courier}'

    def save(self, *args, **kwargs):
        if not 1 <= self.rating <= 5:
            raise ValueError('Rating must be between 1 and 5')
        super().save(*args, **kwargs)
