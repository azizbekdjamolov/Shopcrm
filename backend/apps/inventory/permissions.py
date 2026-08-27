from rest_framework.permissions import BasePermission


class IsInventoryMember(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        if hasattr(request, 'business') and request.business is not None:
            return obj.business == request.business
        return True
