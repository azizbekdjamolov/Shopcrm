from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.utils import timezone

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .permissions import IsNotificationOwner
from apps.core.exceptions import success_response


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationOwner]
    filterset_fields = ['type', 'is_read']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user, is_deleted=False
        ).select_related('user')

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read', 'updated_at'])
        return success_response(data=NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        Notification.objects.filter(
            user=request.user, is_read=False, is_deleted=False
        ).update(is_read=True)
        return success_response(message='All notifications marked as read')

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False, is_deleted=False
        ).count()
        return success_response(data={'count': count})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationOwner]

    def get_queryset(self):
        return NotificationPreference.objects.filter(
            user=self.request.user, is_deleted=False
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
