from rest_framework.permissions import BasePermission


class IsAuditViewer(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        return request.user.role in ['owner', 'admin']
