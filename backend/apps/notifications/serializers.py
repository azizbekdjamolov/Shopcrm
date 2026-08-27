from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id', 'business', 'user', 'title', 'message', 'type',
            'reference_model', 'reference_id', 'is_read', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'user', 'created_at', 'updated_at')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            'id', 'user', 'notification_type', 'in_app_enabled',
            'telegram_enabled', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
