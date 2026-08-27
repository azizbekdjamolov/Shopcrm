from rest_framework import viewsets, permissions
from .models import Customer
from .serializers import CustomerSerializer
from .permissions import IsCustomerMember
from apps.core.exceptions import success_response
from apps.audit.services import AuditService


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerMember]
    filterset_fields = ['business']
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'total_spent', 'total_orders', 'created_at']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Customer.objects.filter(is_deleted=False)
        if business:
            return Customer.objects.filter(business=business, is_deleted=False)
        return Customer.objects.none()

    def perform_create(self, serializer):
        business = getattr(self.request, 'business', None)
        if business:
            instance = serializer.save(business=business)
        else:
            instance = serializer.save()
        AuditService.log_create(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))

    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {f.name: str(getattr(instance, f.name)) for f in instance._meta.fields}
        business = getattr(self.request, 'business', None)
        updated = serializer.save()
        AuditService.log_update(self.request.user, updated, old_values, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))

    def perform_destroy(self, instance):
        business = getattr(self.request, 'business', None)
        AuditService.log_delete(self.request.user, instance, business=business,
                                ip_address=getattr(self.request, '_ip_address', ''),
                                user_agent=getattr(self.request, '_user_agent', ''))
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted', 'updated_at'])

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
