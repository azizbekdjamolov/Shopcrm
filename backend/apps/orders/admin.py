from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'business', 'status', 'total', 'payment_method', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_method', 'payment_status')
    search_fields = ('order_number', 'delivery_address', 'delivery_phone')
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'total')
    search_fields = ('product__name',)
