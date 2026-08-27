from rest_framework.permissions import BasePermission


class IsReportMember(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        return request.user.role in ['owner', 'admin', 'manager']

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        return request.user.role in ['owner', 'admin', 'manager']
