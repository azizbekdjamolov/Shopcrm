from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'business', 'amount', 'payment_method', 'provider', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'provider')
    search_fields = ('provider_transaction_id',)
