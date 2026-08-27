import hmac
import hashlib
from decimal import Decimal
from django.db import transaction
from django.conf import settings

from .models import Payment, get_provider, PaymentProvider


class PaymentService:

    @staticmethod
    @transaction.atomic
    def process_payment(business, amount, payment_method, provider_name='other',
                        order=None, sale=None, customer=None, callback_url='', **kwargs):
        provider = get_provider(provider_name)
        payment = Payment.objects.create(
            business=business,
            order=order,
            sale=sale,
            customer=customer,
            amount=amount,
            payment_method=payment_method,
            provider=provider_name,
            status=Payment.Status.PENDING,
        )

        if payment_method == 'cash':
            payment.status = Payment.Status.PAID
            payment.save(update_fields=['status', 'updated_at'])
            try:
                from apps.notifications.services import NotificationService
                NotificationService.notify_payment_received(business, payment)
            except Exception:
                pass
            return {
                'payment_id': str(payment.id),
                'status': 'PAID',
                'message': 'Cash payment recorded',
            }

        try:
            result = provider.create_payment(
                amount=amount,
                order_id=payment.id,
                callback_url=callback_url,
                **kwargs,
            )
            payment.provider_transaction_id = result.get('transaction_id', '')
            payment.save(update_fields=['provider_transaction_id', 'updated_at'])
            return {
                'payment_id': str(payment.id),
                'status': 'PENDING',
                'payment_url': result.get('payment_url', ''),
                'transaction_id': payment.provider_transaction_id,
            }
        except Exception as e:
            payment.status = Payment.Status.FAILED
            payment.callback_data = {'error': str(e)}
            payment.save(update_fields=['status', 'callback_data', 'updated_at'])
            return {
                'payment_id': str(payment.id),
                'status': 'FAILED',
                'message': str(e),
            }

    @staticmethod
    def verify_webhook(provider_name, payload, secret=''):
        provider = get_provider(provider_name)
        if isinstance(provider, PaymentProvider):
            return {'verified': True}
        if secret:
            signature = payload.get('signature', '')
            computed = hmac.new(
                secret.encode(), str(payload).encode(), hashlib.sha256
            ).hexdigest()
            return {'verified': signature == computed}
        return {'verified': True}

    @staticmethod
    @transaction.atomic
    def handle_callback(provider_name, payload):
        provider = get_provider(provider_name)
        result = provider.handle_callback(payload)
        transaction_id = result.get('transaction_id', '')
        payment = Payment.objects.filter(
            provider_transaction_id=transaction_id
        ).first()
        if not payment:
            return {'error': 'Payment not found'}
        payment.callback_data = payload
        status = result.get('status', '')
        if status == 'paid':
            payment.status = Payment.Status.PAID
            if payment.order:
                payment.order.payment_status = 'paid'
                payment.order.save(update_fields=['payment_status', 'updated_at'])
            if payment.sale:
                payment.sale.status = 'completed'
                payment.sale.save(update_fields=['status', 'updated_at'])
        elif status == 'failed':
            payment.status = Payment.Status.FAILED
        elif status == 'refunded':
            payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status', 'callback_data', 'updated_at'])
        return {
            'payment_id': str(payment.id),
            'status': payment.status,
        }

    @staticmethod
    def process_callback(business, provider_name: str, callback_data: dict):
        """Process a payment callback from Click/Payme"""
        from .models import Payment
        order_id = callback_data.get('order_id', '')
        transaction_id = callback_data.get('transaction_id', '')

        payment = Payment.objects.filter(
            business=business,
            provider_transaction_id=str(transaction_id),
            provider=provider_name,
            status=Payment.Status.PENDING,
        ).first()

        if payment:
            payment.status = Payment.Status.PAID
            payment.callback_data = callback_data
            payment.save(update_fields=['status', 'callback_data', 'updated_at'])

            if payment.order:
                payment.order.payment_status = 'paid'
                payment.order.save(update_fields=['payment_status', 'updated_at'])

            if payment.sale:
                payment.sale.payment_status = 'completed'
                payment.sale.save(update_fields=['payment_status', 'updated_at'])
