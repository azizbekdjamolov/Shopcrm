from django.contrib import admin
from .models import Debt, DebtTransaction


class DebtTransactionInline(admin.TabularInline):
    model = DebtTransaction
    extra = 0


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ('customer', 'business', 'total_amount', 'paid_amount', 'remaining_amount', 'status', 'due_date')
    list_filter = ('status',)
    search_fields = ('customer__name',)
    inlines = [DebtTransactionInline]


@admin.register(DebtTransaction)
class DebtTransactionAdmin(admin.ModelAdmin):
    list_display = ('debt', 'amount', 'transaction_type', 'created_by', 'created_at')
    list_filter = ('transaction_type',)
