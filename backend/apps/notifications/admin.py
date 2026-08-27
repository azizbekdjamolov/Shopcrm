from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'business', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read')
    search_fields = ('title', 'message')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'in_app_enabled', 'telegram_enabled')
    list_filter = ('notification_type',)
