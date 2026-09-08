from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Inventory, InventoryMovement
from apps.products.models import Product


class InventoryService:

    @staticmethod
    def get_or_create_inventory(business, product):
        inventory, created = Inventory.objects.get_or_create(
            business=business,
            product=product,
            defaults={
                'quantity': product.quantity,
                'minimum_stock': product.minimum_stock,
            }
        )
        if not created and inventory.quantity < product.quantity:
            inventory.quantity = product.quantity
            inventory.save(update_fields=['quantity', 'updated_at'])
        return inventory

    @staticmethod
    @transaction.atomic
    def deduct_stock(business, product, quantity, user=None, reference_id=None, reference_model='', notes=''):
        inventory = InventoryService.get_or_create_inventory(business, product)
        if inventory.quantity < quantity:
            raise ValueError(f'Insufficient stock for {product.name}. Available: {inventory.quantity}, Requested: {quantity}')
        inventory.quantity -= quantity
        inventory.save(update_fields=['quantity', 'updated_at'])
        product.quantity = inventory.quantity
        product.save(update_fields=['quantity', 'updated_at'])
        InventoryMovement.objects.create(
            business=business,
            product=product,
            movement_type=InventoryMovement.MovementType.SALE,
            quantity=-quantity,
            reference_id=reference_id,
            reference_model=reference_model,
            notes=notes,
            created_by=user,
        )
        if inventory.quantity <= product.minimum_stock:
            try:
                from apps.notifications.services import NotificationService
                NotificationService.notify_low_stock(business, product)
            except Exception:
                pass
        return inventory

    @staticmethod
    @transaction.atomic
    def add_stock(business, product, quantity, user=None, reference_id=None, reference_model='', notes=''):
        inventory = InventoryService.get_or_create_inventory(business, product)
        inventory.quantity += quantity
        inventory.save(update_fields=['quantity', 'updated_at'])
        product.quantity = inventory.quantity
        product.save(update_fields=['quantity', 'updated_at'])
        InventoryMovement.objects.create(
            business=business,
            product=product,
            movement_type=InventoryMovement.MovementType.PURCHASE,
            quantity=quantity,
            reference_id=reference_id,
            reference_model=reference_model,
            notes=notes,
            created_by=user,
        )
        return inventory

    @staticmethod
    @transaction.atomic
    def adjust_stock(business, product, new_quantity, user=None, notes=''):
        inventory = InventoryService.get_or_create_inventory(business, product)
        difference = new_quantity - inventory.quantity
        inventory.quantity = new_quantity
        inventory.save(update_fields=['quantity', 'updated_at'])
        product.quantity = new_quantity
        product.save(update_fields=['quantity', 'updated_at'])
        InventoryMovement.objects.create(
            business=business,
            product=product,
            movement_type=InventoryMovement.MovementType.ADJUSTMENT,
            quantity=difference,
            notes=notes or f'Adjusted from {inventory.quantity - difference} to {new_quantity}',
            created_by=user,
        )
        return inventory

    @staticmethod
    @transaction.atomic
    def transfer_stock(business, from_product, to_product, quantity, user=None, notes=''):
        from_inventory = InventoryService.get_or_create_inventory(business, from_product)
        to_inventory = InventoryService.get_or_create_inventory(business, to_product)
        if from_inventory.quantity < quantity:
            raise ValueError(f'Insufficient stock for transfer from {from_product.name}')
        from_inventory.quantity -= quantity
        from_inventory.save(update_fields=['quantity', 'updated_at'])
        to_inventory.quantity += quantity
        to_inventory.save(update_fields=['quantity', 'updated_at'])
        from_product.quantity = from_inventory.quantity
        from_product.save(update_fields=['quantity'])
        to_product.quantity = to_inventory.quantity
        to_product.save(update_fields=['quantity'])
        InventoryMovement.objects.create(
            business=business,
            product=from_product,
            movement_type=InventoryMovement.MovementType.TRANSFER,
            quantity=-quantity,
            notes=f'Transfer to {to_product.name}',
            created_by=user,
        )
        InventoryMovement.objects.create(
            business=business,
            product=to_product,
            movement_type=InventoryMovement.MovementType.TRANSFER,
            quantity=quantity,
            notes=f'Transfer from {from_product.name}',
            created_by=user,
        )
        return from_inventory, to_inventory

    @staticmethod
    def get_low_stock_products(business):
        inventories = Inventory.objects.filter(
            business=business, is_deleted=False
        ).select_related('product')
        return [inv for inv in inventories if inv.is_low_stock]

    @staticmethod
    def get_stock_movements(business, product=None, movement_type=None):
        queryset = InventoryMovement.objects.filter(
            business=business, is_deleted=False
        ).select_related('product', 'created_by')
        if product:
            queryset = queryset.filter(product=product)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        return queryset
