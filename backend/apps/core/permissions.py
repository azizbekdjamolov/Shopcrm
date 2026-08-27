from rest_framework.permissions import BasePermission


class IsBusinessMember(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'business') and request.business is not None

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'business'):
            return obj.business == request.business
        return False


class IsBusinessOwner(BasePermission):
    def has_permission(self, request, view):
        if not hasattr(request, 'business') or request.business is None:
            return False
        return request.user.businessrole_set.filter(
            business=request.business, role__in=['owner', 'admin']
        ).exists()


class IsAdminOrOwner(BasePermission):
    def has_permission(self, request, view):
        if not hasattr(request, 'business') or request.business is None:
            return False
        return request.user.businessrole_set.filter(
            business=request.business, role__in=['owner', 'admin']
        ).exists()
