from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'phone', 'email', 'total_spent', 'total_orders', 'created_at')
    list_filter = ('business',)
    search_fields = ('name', 'phone', 'email')
