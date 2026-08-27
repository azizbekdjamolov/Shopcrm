from django.contrib import admin
from .models import Inventory, InventoryMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'business', 'quantity', 'minimum_stock', 'warehouse', 'last_updated')
    list_filter = ('warehouse',)
    search_fields = ('product__name',)


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'business', 'movement_type', 'quantity', 'created_by', 'created_at')
    list_filter = ('movement_type',)
    search_fields = ('product__name',)
