from django.contrib import admin
from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'business', 'total', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('invoice_number',)
