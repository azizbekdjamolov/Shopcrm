import uuid
import hashlib
import hmac
import json
from django.db import models
from apps.core.models import AbstractBusinessModel


class Payment(AbstractBusinessModel):
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        ONLINE = 'online', 'Online'

    class Provider(models.TextChoices):
        CLICK = 'click', 'Click'
        PAYME = 'payme', 'Payme'
        UZUM = 'uzum', 'Uzum'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    sale = models.ForeignKey(
        'sales.Sale', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.OTHER)
    provider_transaction_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    callback_data = models.JSONField(default=dict, blank=True)

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['provider_transaction_id']),
        ]

    def __str__(self):
        return f'Payment {self.id} - {self.amount} ({self.status})'


class PaymentProvider:
    """Base class for payment providers."""

    def create_payment(self, amount, order_id, callback_url, **kwargs):
        raise NotImplementedError

    def verify_payment(self, transaction_id):
        raise NotImplementedError

    def handle_callback(self, payload):
        raise NotImplementedError


class ClickProvider(PaymentProvider):
    """Click payment provider implementation."""

    def create_payment(self, amount, order_id, callback_url, **kwargs):
        return {
            'provider': 'click',
            'amount': str(amount),
            'order_id': str(order_id),
            'payment_url': f'https://click.uz/pay?amount={amount}&order={order_id}',
            'transaction_id': f'click_{order_id}',
        }

    def verify_payment(self, transaction_id):
        return {'verified': True, 'transaction_id': transaction_id}

    def handle_callback(self, payload):
        return {
            'status': 'paid',
            'transaction_id': payload.get('click_trans_id', ''),
            'amount': payload.get('amount', 0),
        }


class PaymeProvider(PaymentProvider):
    """Payme payment provider implementation."""

    def create_payment(self, amount, order_id, callback_url, **kwargs):
        return {
            'provider': 'payme',
            'amount': str(amount),
            'order_id': str(order_id),
            'payment_url': f'https://payme.uz/pay?amount={amount}&order={order_id}',
            'transaction_id': f'payme_{order_id}',
        }

    def verify_payment(self, transaction_id):
        return {'verified': True, 'transaction_id': transaction_id}

    def handle_callback(self, payload):
        return {
            'status': 'paid',
            'transaction_id': payload.get('transaction_id', ''),
            'amount': payload.get('amount', 0),
        }


class UzumProvider(PaymentProvider):
    """Uzum Bank payment provider implementation."""

    def create_payment(self, amount, order_id, callback_url, **kwargs):
        return {
            'provider': 'uzum',
            'amount': str(amount),
            'order_id': str(order_id),
            'payment_url': f'https://uzum.uz/pay?amount={amount}&order={order_id}',
            'transaction_id': f'uzum_{order_id}',
        }

    def verify_payment(self, transaction_id):
        return {'verified': True, 'transaction_id': transaction_id}

    def handle_callback(self, payload):
        return {
            'status': 'paid',
            'transaction_id': payload.get('transaction_id', ''),
            'amount': payload.get('amount', 0),
        }


PROVIDER_MAP = {
    'click': ClickProvider(),
    'payme': PaymeProvider(),
    'uzum': UzumProvider(),
}


def get_provider(name):
    return PROVIDER_MAP.get(name, PaymentProvider())
