from django.contrib import admin
from .models import BranchSettings


@admin.register(BranchSettings)
class BranchSettingsAdmin(admin.ModelAdmin):
    list_display = ('branch', 'is_delivery_enabled', 'is_pickup_enabled')
    list_filter = ('is_delivery_enabled', 'is_pickup_enabled')
