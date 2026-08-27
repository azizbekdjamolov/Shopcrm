from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'owner'

    def has_object_permission(self, request, view, obj):
        return request.user.role == 'owner'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['owner', 'admin']

    def has_object_permission(self, request, view, obj):
        return request.user.role in ['owner', 'admin']


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['owner', 'admin', 'manager']

    def has_object_permission(self, request, view, obj):
        return request.user.role in ['owner', 'admin', 'manager']


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['owner', 'admin', 'manager', 'seller']

    def has_object_permission(self, request, view, obj):
        return request.user.role in ['owner', 'admin', 'manager', 'seller']


class IsCourier(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['owner', 'admin', 'courier']

    def has_object_permission(self, request, view, obj):
        return request.user.role in ['owner', 'admin', 'courier']


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'customer'

    def has_object_permission(self, request, view, obj):
        return request.user.role == 'customer'


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_platform_admin

    def has_object_permission(self, request, view, obj):
        return request.user.is_platform_admin


class HasPermission(BasePermission):
    """Dynamic permission class that checks allowed roles via view attribute."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed_roles = getattr(view, 'allowed_roles', [])
        if not allowed_roles:
            return True
        return request.user.role in allowed_roles or request.user.is_platform_admin

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        allowed_roles = getattr(view, 'allowed_roles', [])
        if not allowed_roles:
            return True
        return request.user.role in allowed_roles
