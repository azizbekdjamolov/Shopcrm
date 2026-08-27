from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Delivery, CourierRating


class DeliveryService:

    STATUS_TRANSITIONS = {
        'ASSIGNED': ['ACCEPTED'],
        'ACCEPTED': ['PICKED_UP'],
        'PICKED_UP': ['ON_THE_WAY'],
        'ON_THE_WAY': ['ARRIVED'],
        'ARRIVED': ['DELIVERED'],
        'DELIVERED': [],
    }

    @staticmethod
    def assign_courier(business, order, courier):
        if Delivery.objects.filter(order=order, is_deleted=False).exists():
            raise ValueError('Delivery already assigned for this order')
        delivery = Delivery.objects.create(
            business=business,
            order=order,
            courier=courier,
            status=Delivery.Status.ASSIGNED,
        )
        return delivery

    @staticmethod
    def update_status(delivery, new_status):
        current_status = delivery.status
        allowed_transitions = DeliveryService.STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions:
            raise ValueError(
                f'Cannot transition from {current_status} to {new_status}. '
                f'Allowed: {allowed_transitions}'
            )
        delivery.status = new_status
        if new_status == 'PICKED_UP':
            delivery.picked_up_at = timezone.now()
        elif new_status == 'DELIVERED':
            delivery.delivered_at = timezone.now()
            delivery.order.status = 'DELIVERED'
            delivery.order.delivered_at = timezone.now()
            delivery.order.payment_status = 'paid'
            delivery.order.save(update_fields=['status', 'delivered_at', 'payment_status', 'updated_at'])
        delivery.save(update_fields=['status', 'picked_up_at', 'delivered_at', 'updated_at'])
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'business_{delivery.business.id}',
                {
                    'type': 'delivery_update',
                    'data': {
                        'delivery_id': str(delivery.id),
                        'order_number': delivery.order.order_number,
                        'status': delivery.status,
                        'courier_id': str(delivery.courier_id),
                    },
                }
            )
            async_to_sync(channel_layer.group_send)(
                f'courier_{delivery.courier_id}',
                {
                    'type': 'delivery_status_update',
                    'data': {
                        'delivery_id': str(delivery.id),
                        'order_number': delivery.order.order_number,
                        'status': delivery.status,
                    },
                }
            )
        except Exception:
            pass
        try:
            from apps.notifications.services import NotificationService
            status_messages = {
                'ACCEPTED': 'Courier accepted the delivery',
                'PICKED_UP': 'Package picked up by courier',
                'ON_THE_WAY': 'Package is on the way',
                'ARRIVED': 'Courier has arrived',
                'DELIVERED': 'Package delivered successfully',
            }
            msg = status_messages.get(new_status, f'Delivery status: {new_status}')
            NotificationService.notify_delivery_update(delivery.business, delivery, msg)
        except Exception:
            pass
        return delivery

    @staticmethod
    def rate_courier(delivery, customer, rating, comment=''):
        if delivery.status != Delivery.Status.DELIVERED:
            raise ValueError('Can only rate completed deliveries')
        if rating < 1 or rating > 5:
            raise ValueError('Rating must be between 1 and 5')
        courier_rating = CourierRating.objects.create(
            business=delivery.business,
            delivery=delivery,
            courier=delivery.courier,
            customer=customer,
            rating=rating,
            comment=comment,
        )
        return courier_rating

    @staticmethod
    def get_courier_stats(courier, start_date=None, end_date=None):
        from django.db.models import Avg, Count
        from datetime import timedelta

        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()

        deliveries = Delivery.objects.filter(
            courier=courier,
            is_deleted=False,
        )
        total_deliveries = deliveries.filter(status=Delivery.Status.DELIVERED).count()
        avg_rating = CourierRating.objects.filter(
            courier=courier, is_deleted=False
        ).aggregate(avg=Avg('rating'))['avg'] or 0
        ratings_count = CourierRating.objects.filter(
            courier=courier, is_deleted=False
        ).count()

        return {
            'total_deliveries': total_deliveries,
            'average_rating': round(avg_rating, 2),
            'total_ratings': ratings_count,
        }
