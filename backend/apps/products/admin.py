from django.contrib import admin
from .models import Category, Supplier, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'phone', 'email')
    search_fields = ('name', 'phone', 'email')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'barcode', 'selling_price', 'quantity', 'status')
    list_filter = ('status', 'category')
    search_fields = ('name', 'barcode')
    prepopulated_fields = {'slug': ('name',)}
