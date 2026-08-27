from django.contrib import admin
from .models import SubscriptionPlan, Subscription


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'interval', 'max_users', 'max_branches', 'is_active')
    list_filter = ('interval', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('business', 'plan', 'status', 'starts_at', 'ends_at', 'auto_renew')
    list_filter = ('status',)
    search_fields = ('business__name',)
