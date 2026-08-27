from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('total',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('sale_number', 'business', 'seller', 'total', 'payment_method', 'status', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('sale_number',)
    inlines = [SaleItemInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ('sale', 'product', 'quantity', 'unit_price', 'discount', 'total')
    search_fields = ('product__name',)
