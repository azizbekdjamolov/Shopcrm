from rest_framework.permissions import BasePermission


class IsOrderMember(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        if hasattr(request, 'business') and request.business is not None:
            if view.action == 'create':
                return True
            return request.user.business_roles.filter(
                business=request.business, is_active=True
            ).exists()
        business_id = request.data.get('business_id') or request.data.get('business') or view.kwargs.get('business_pk')
        if business_id:
            return True
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        if hasattr(request, 'business') and request.business is not None:
            return obj.business == request.business
        return request.user.business_roles.filter(
            business=obj.business, is_active=True
        ).exists()
