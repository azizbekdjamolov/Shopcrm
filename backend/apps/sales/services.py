from django.db import transaction
from django.conf import settings

from .models import Sale, SaleItem
from apps.inventory.services import InventoryService
from apps.debts.services import DebtService
from apps.customers.models import Customer


class SaleService:

    @staticmethod
    @transaction.atomic
    def create_sale(business, seller, items_data, customer=None, branch=None,
                    discount=0, tax=0, payment_method='cash', notes=''):
        subtotal = 0
        sale_items = []

        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data.get('unit_price', product.selling_price)
            item_discount = item_data.get('discount', 0)
            item_total = (unit_price * quantity) - item_discount
            subtotal += item_total
            sale_items.append({
                'product': product,
                'quantity': quantity,
                'unit_price': unit_price,
                'discount': item_discount,
                'total': item_total,
            })

        total = subtotal - discount + tax

        # Validate stock availability
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            if product.quantity < quantity:
                raise ValueError(f"Insufficient stock for '{product.name}': available {product.quantity}, requested {quantity}")

        sale = Sale.objects.create(
            business=business,
            customer=customer,
            branch=branch,
            seller=seller,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            total=total,
            payment_method=payment_method,
            notes=notes,
        )

        for item in sale_items:
            SaleItem.objects.create(
                business=business,
                sale=sale,
                product=item['product'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                discount=item['discount'],
                total=item['total'],
            )
            InventoryService.deduct_stock(
                business=business,
                product=item['product'],
                quantity=item['quantity'],
                user=seller,
                reference_id=sale.id,
                reference_model='Sale',
                notes=f'Sale {sale.sale_number}',
            )

        if customer and payment_method == 'debt':
            DebtService.add_debt(
                business=business,
                customer=customer,
                amount=total,
                reference_id=sale.id,
                notes=f'Debt from sale {sale.sale_number}',
                created_by=seller,
            )

        if customer:
            customer.total_spent += total
            customer.total_orders += 1
            customer.save(update_fields=['total_spent', 'total_orders', 'updated_at'])

        try:
            from apps.notifications.services import NotificationService
            NotificationService.send_bulk(
                business=business,
                users=[seller],
                title=f'New Sale #{sale.sale_number}',
                message=f'Sale completed. Total: {total} UZS. Payment: {payment_method}',
                notification_type='order',
                reference_model='Sale',
                reference_id=sale.id,
            )
        except Exception:
            pass

        return sale

    @staticmethod
    def calculate_profit(sale):
        items = sale.items.select_related('product').all()
        total_cost = sum(
            item.quantity * item.product.purchase_price for item in items
        )
        return sale.total - total_cost

    @staticmethod
    def generate_invoice(sale):
        from apps.invoices.services import InvoiceService
        return InvoiceService.generate_invoice(business=sale.business, sale=sale)
