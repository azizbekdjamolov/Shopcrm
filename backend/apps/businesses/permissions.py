from rest_framework.permissions import BasePermission


class IsBusinessMember(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        business_id = view.kwargs.get('business_pk') or request.data.get('business')
        if not business_id:
            return request.user.is_platform_admin
        return request.user.business_roles.filter(
            business_id=business_id, is_active=True
        ).exists() or request.user.is_platform_admin

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        if hasattr(obj, 'business'):
            return request.user.business_roles.filter(
                business=obj.business, is_active=True
            ).exists()
        return False


class IsBusinessOwner(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        business_id = (
            view.kwargs.get('business_pk')
            or view.kwargs.get('pk')
            or request.data.get('business')
        )
        if not business_id:
            return request.user.is_platform_admin
        return request.user.business_roles.filter(
            business_id=business_id, role__in=['owner', 'admin'], is_active=True
        ).exists() or request.user.is_platform_admin

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        if hasattr(obj, 'business'):
            return request.user.business_roles.filter(
                business=obj.business, role__in=['owner', 'admin'], is_active=True
            ).exists()
        return False


class CanManageBranch(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        business_id = view.kwargs.get('business_pk')
        if business_id:
            return request.user.business_roles.filter(
                business_id=business_id, role__in=['owner', 'admin', 'manager'], is_active=True
            ).exists()
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        return request.user.business_roles.filter(
            business=obj.business, role__in=['owner', 'admin', 'manager'], is_active=True
        ).exists()
