from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsAuditViewer
from apps.core.exceptions import success_response


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditViewer]
    filterset_fields = ['action', 'model_name', 'user']
    search_fields = ['model_name', 'object_id', 'object_repr']
    ordering_fields = ['created_at']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return AuditLog.objects.filter(is_deleted=False).select_related('user')
        if business:
            return AuditLog.objects.filter(
                business=business, is_deleted=False
            ).select_related('user')
        return AuditLog.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
