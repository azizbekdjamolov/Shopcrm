from rest_framework.permissions import BasePermission


class IsSubscriptionAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_platform_admin:
            return True
        if request.method in ['GET']:
            business_id = view.kwargs.get('business_pk') or request.query_params.get('business')
            if business_id:
                return request.user.business_roles.filter(
                    business_id=business_id, is_active=True
                ).exists()
            return True
        return request.user.role in ['owner', 'admin']

    def has_object_permission(self, request, view, obj):
        if request.user.is_platform_admin:
            return True
        return request.user.business_roles.filter(
            business=obj.business, is_active=True
        ).exists()
