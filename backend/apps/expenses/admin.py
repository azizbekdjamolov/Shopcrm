from django.contrib import admin
from .models import ExpenseCategory, Expense


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'icon')
    search_fields = ('name',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'business', 'category', 'amount', 'date', 'created_by')
    list_filter = ('category', 'date')
    search_fields = ('description',)
