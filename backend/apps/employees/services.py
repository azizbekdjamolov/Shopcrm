from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models import Employee


class EmployeeService:

    @staticmethod
    def calculate_performance(employee, start_date=None, end_date=None):
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()

        from apps.sales.models import Sale
        sales = Sale.objects.filter(
            seller=employee.user,
            business=employee.business,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            is_deleted=False,
        )

        total_sales = sales.aggregate(
            total=Sum('total'),
            count=Count('id'),
        )

        from apps.delivery.models import Delivery
        deliveries_count = 0
        if employee.user and employee.role == 'courier':
            deliveries_count = Delivery.objects.filter(
                courier=employee.user,
                status='delivered',
                delivered_at__date__gte=start_date,
                delivered_at__date__lte=end_date,
            ).count()

        shifts_completed = employee.shifts.filter(
            date__gte=start_date,
            date__lte=end_date,
        ).count()

        return {
            'employee_id': str(employee.id),
            'employee_name': employee.name,
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            },
            'total_sales_amount': str(total_sales['total'] or 0),
            'total_sales_count': total_sales['count'],
            'deliveries_completed': deliveries_count,
            'shifts_completed': shifts_completed,
            'base_salary': str(employee.salary),
            'bonus': str(employee.bonus),
            'total_compensation': str(employee.salary + employee.bonus),
        }

    @staticmethod
    def get_team_performance(business, start_date=None, end_date=None):
        employees = Employee.objects.filter(
            business=business, status=Employee.Status.ACTIVE, is_deleted=False
        )
        performances = []
        for emp in employees:
            performance = EmployeeService.calculate_performance(emp, start_date, end_date)
            performances.append(performance)
        return performances
