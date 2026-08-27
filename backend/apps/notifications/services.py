from django.conf import settings
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification, NotificationPreference


class NotificationService:

    @staticmethod
    def create_notification(business, user, title, message, notification_type='system',
                            reference_model='', reference_id=None):
        preference, _ = NotificationPreference.objects.get_or_create(
            user=user, notification_type=notification_type
        )
        if not preference.in_app_enabled:
            return None
        notification = Notification.objects.create(
            business=business,
            user=user,
            title=title,
            message=message,
            type=notification_type,
            reference_model=reference_model,
            reference_id=reference_id,
        )
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'notifications_{user.id}',
                {
                    'type': 'notification_send',
                    'data': {
                        'id': str(notification.id),
                        'title': title,
                        'message': message,
                        'type': notification_type,
                        'reference_model': reference_model,
                        'reference_id': str(reference_id) if reference_id else None,
                        'created_at': notification.created_at.isoformat() if notification.created_at else None,
                    },
                }
            )
        except Exception:
            pass
        if preference.telegram_enabled and user.telegram_user_id:
            NotificationService._send_telegram(user.telegram_user_id, title, message)
        return notification

    @staticmethod
    def send_bulk(business, users, title, message, notification_type='system',
                  reference_model='', reference_id=None):
        notifications = []
        for user in users:
            notification = NotificationService.create_notification(
                business=business,
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                reference_model=reference_model,
                reference_id=reference_id,
            )
            if notification:
                notifications.append(notification)
        return notifications

    @staticmethod
    def notify_new_order(business, order):
        from apps.businesses.models import BusinessUser
        users = BusinessUser.objects.filter(
            business=business,
            role__in=['owner', 'admin', 'manager'],
            is_active=True,
        ).select_related('user')
        user_list = [bu.user for bu in users]
        return NotificationService.send_bulk(
            business=business,
            users=user_list,
            title=f'New Order #{order.order_number}',
            message=f'New order received. Total: {order.total}',
            notification_type='order',
            reference_model='Order',
            reference_id=order.id,
        )

    @staticmethod
    def notify_low_stock(business, product):
        from apps.businesses.models import BusinessUser
        users = BusinessUser.objects.filter(
            business=business,
            role__in=['owner', 'admin', 'manager'],
            is_active=True,
        ).select_related('user')
        user_list = [bu.user for bu in users]
        return NotificationService.send_bulk(
            business=business,
            users=user_list,
            title=f'Low Stock Alert: {product.name}',
            message=f'{product.name} is low on stock. Current quantity: {product.quantity}',
            notification_type='stock',
            reference_model='Product',
            reference_id=product.id,
        )

    @staticmethod
    def notify_payment_received(business, payment):
        from apps.businesses.models import BusinessUser
        users = BusinessUser.objects.filter(
            business=business,
            role__in=['owner', 'admin'],
            is_active=True,
        ).select_related('user')
        user_list = [bu.user for bu in users]
        return NotificationService.send_bulk(
            business=business,
            users=user_list,
            title='Payment Received',
            message=f'Payment of {payment.amount} received via {payment.payment_method}',
            notification_type='payment',
            reference_model='Payment',
            reference_id=payment.id,
        )

    @staticmethod
    def notify_delivery_update(business, delivery, status_message):
        from apps.businesses.models import BusinessUser
        users = BusinessUser.objects.filter(
            business=business,
            role__in=['owner', 'admin', 'manager'],
            is_active=True,
        ).select_related('user')
        user_list = [bu.user for bu in users]
        return NotificationService.send_bulk(
            business=business,
            users=user_list,
            title=f'Delivery Update: {delivery.order.order_number}',
            message=status_message,
            notification_type='delivery',
            reference_model='Delivery',
            reference_id=delivery.id,
        )

    @staticmethod
    def notify_debt_overdue(business, debt):
        from apps.businesses.models import BusinessUser
        users = BusinessUser.objects.filter(
            business=business,
            role__in=['owner', 'admin', 'manager'],
            is_active=True,
        ).select_related('user')
        user_list = [bu.user for bu in users]
        return NotificationService.send_bulk(
            business=business,
            users=user_list,
            title=f'Debt Overdue: {debt.customer.name}',
            message=f'Debt of {debt.remaining_amount} is overdue. Customer: {debt.customer.name}',
            notification_type='debt',
            reference_model='Debt',
            reference_id=debt.id,
        )

    @staticmethod
    def _send_telegram(telegram_user_id, title, message):
        import requests
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            return
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        text = f'<b>{title}</b>\n\n{message}'
        try:
            requests.post(url, json={
                'chat_id': telegram_user_id,
                'text': text,
                'parse_mode': 'HTML',
            }, timeout=10)
        except Exception:
            pass
