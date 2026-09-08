import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel
from apps.core.utils import generate_order_number


class Order(AbstractBusinessModel):
    class Status(models.TextChoices):
        NEW = 'NEW', 'New'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PREPARING = 'PREPARING', 'Preparing'
        READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', 'Ready for Delivery'
        COURIER_ASSIGNED = 'COURIER_ASSIGNED', 'Courier Assigned'
        ON_THE_WAY = 'ON_THE_WAY', 'On the Way'
        ARRIVED = 'ARRIVED', 'Arrived'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        ONLINE = 'online', 'Online'
        CLICK = 'click', 'Click'
        PAYME = 'payme', 'Payme'

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        PARTIALLY_PAID = 'partially_paid', 'Partially Paid'
        REFUNDED = 'refunded', 'Refunded'

    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders'
    )
    branch = models.ForeignKey(
        'businesses.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders'
    )
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.NEW, db_index=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_address = models.TextField(blank=True, default='')
    delivery_phone = models.CharField(max_length=20, blank=True, default='')
    delivery_notes = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['business', 'created_at']),
            models.Index(fields=['business', 'payment_status']),
        ]

    def __str__(self):
        return f'Order {self.order_number}'

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_number('ORD')
        super().save(*args, **kwargs)

    @property
    def is_cancellable(self):
        return self.status in [
            self.Status.NEW, self.Status.CONFIRMED, self.Status.PREPARING
        ]


class OrderItem(AbstractBusinessModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='order_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

    def save(self, *args, **kwargs):
        self.total = self.unit_price * self.quantity
        super().save(*args, **kwargs)
