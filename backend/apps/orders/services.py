from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Order, OrderItem
from apps.inventory.services import InventoryService
from apps.products.models import Product
from apps.customers.models import Customer


class OrderService:

    STATUS_TRANSITIONS = {
        'NEW': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY_FOR_DELIVERY', 'CANCELLED'],
        'READY_FOR_DELIVERY': ['COURIER_ASSIGNED', 'CANCELLED'],
        'COURIER_ASSIGNED': ['ON_THE_WAY', 'CANCELLED'],
        'ON_THE_WAY': ['ARRIVED'],
        'ARRIVED': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': [],
    }

    @staticmethod
    @transaction.atomic
    def create_order(business, items_data, customer=None, branch=None,
                     delivery_address='', delivery_phone='', delivery_notes='',
                     delivery_fee=0, discount=0, payment_method='cash'):
        subtotal = 0
        order_items = []

        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data.get('unit_price', product.selling_price)
            item_total = unit_price * quantity
            subtotal += item_total
            order_items.append({
                'product': product,
                'quantity': quantity,
                'unit_price': unit_price,
                'total': item_total,
            })

        total = subtotal + delivery_fee - discount

        order = Order.objects.create(
            business=business,
            customer=customer,
            branch=branch,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount=discount,
            total=total,
            delivery_address=delivery_address,
            delivery_phone=delivery_phone,
            delivery_notes=delivery_notes,
            payment_method=payment_method,
        )

        for item in order_items:
            OrderItem.objects.create(
                business=business,
                order=order,
                product=item['product'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                total=item['total'],
            )
            InventoryService.deduct_stock(
                business=business,
                product=item['product'],
                quantity=item['quantity'],
                reference_id=order.id,
                reference_model='Order',
                notes=f'Order {order.order_number}',
            )

        if customer:
            customer.total_orders += 1
            customer.save(update_fields=['total_orders', 'updated_at'])

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_new_order(business, order)
        except Exception:
            pass

        return order

    @staticmethod
    def update_status(order, new_status):
        current_status = order.status
        allowed_transitions = OrderService.STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions:
            raise ValueError(
                f'Cannot transition from {current_status} to {new_status}. '
                f'Allowed: {allowed_transitions}'
            )
        order.status = new_status
        update_fields = ['status', 'updated_at']
        if new_status == 'CONFIRMED':
            order.confirmed_at = timezone.now()
            update_fields.append('confirmed_at')
        elif new_status == 'DELIVERED':
            order.delivered_at = timezone.now()
            update_fields.append('delivered_at')
            order.payment_status = Order.PaymentStatus.PAID
            update_fields.append('payment_status')
        elif new_status == 'CANCELLED':
            OrderService._restore_stock(order)
        order.save(update_fields=update_fields)
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'business_{order.business.id}',
                {
                    'type': 'order_update',
                    'data': {
                        'order_id': str(order.id),
                        'order_number': order.order_number,
                        'status': order.status,
                        'total': str(order.total),
                    },
                }
            )
        except Exception:
            pass
        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order, reason=''):
        if not order.is_cancellable:
            raise ValueError(f'Order in {order.status} status cannot be cancelled')
        order.status = Order.Status.CANCELLED
        order.notes = f'{order.notes}\nCancellation reason: {reason}'.strip()
        order.save(update_fields=['status', 'notes', 'updated_at'])
        OrderService._restore_stock(order)
        return order

    @staticmethod
    def _restore_stock(order):
        for item in order.items.select_related('product').all():
            InventoryService.add_stock(
                business=order.business,
                product=item.product,
                quantity=item.quantity,
                reference_id=order.id,
                reference_model='Order',
                notes=f'Cancelled order {order.order_number}',
            )
