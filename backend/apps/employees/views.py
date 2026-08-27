from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Employee, EmployeeShift
from .serializers import EmployeeSerializer, EmployeeShiftSerializer
from .services import EmployeeService
from .permissions import IsEmployeeMember
from apps.core.exceptions import success_response
from apps.audit.services import AuditService


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployeeMember]
    filterset_fields = ['status', 'shift', 'branch']
    search_fields = ['name', 'phone', 'role']
    ordering_fields = ['name', 'salary', 'hire_date', 'created_at']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Employee.objects.filter(is_deleted=False).select_related('branch', 'user')
        if business:
            return Employee.objects.filter(
                business=business, is_deleted=False
            ).select_related('branch', 'user')
        return Employee.objects.none()

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

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        employee = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        performance = EmployeeService.calculate_performance(employee, start_date, end_date)
        return success_response(data=performance)

    @action(detail=False, methods=['get'])
    def team_performance(self, request):
        business = getattr(request, 'business', None)
        if business:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            performances = EmployeeService.get_team_performance(business, start_date, end_date)
            return success_response(data=performances)
        return success_response(data=[])

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class EmployeeShiftViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeShiftSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployeeMember]
    filterset_fields = ['employee', 'date']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if business:
            return EmployeeShift.objects.filter(
                employee__business=business, is_deleted=False
            ).select_related('employee')
        return EmployeeShift.objects.none()
