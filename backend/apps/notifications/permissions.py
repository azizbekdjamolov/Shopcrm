from rest_framework.permissions import BasePermission


class IsNotificationOwner(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        if hasattr(obj, 'user') and obj.user:
            return obj.user == request.user
        if hasattr(obj, 'business'):
            return request.user.business_roles.filter(
                business=obj.business, is_active=True
            ).exists()
        return False
