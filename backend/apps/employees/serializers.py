from rest_framework import serializers
from .models import Employee, EmployeeShift


class EmployeeShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeShift
        fields = ('id', 'employee', 'date', 'shift_start', 'shift_end', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class EmployeeSerializer(serializers.ModelSerializer):
    shifts = EmployeeShiftSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')

    class Meta:
        model = Employee
        fields = (
            'id', 'business', 'user', 'name', 'phone', 'role', 'salary',
            'branch', 'branch_name', 'status', 'shift', 'hire_date',
            'bonus', 'notes', 'shifts', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and not request.user.is_platform_admin:
            if request.user.role not in ['owner', 'admin']:
                data.pop('salary', None)
                data.pop('bonus', None)
        return data

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs
