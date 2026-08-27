import uuid
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class Employee(AbstractBusinessModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        ON_LEAVE = 'on_leave', 'On Leave'
        TERMINATED = 'terminated', 'Terminated'

    class Shift(models.TextChoices):
        MORNING = 'morning', 'Morning'
        AFTERNOON = 'afternoon', 'Afternoon'
        EVENING = 'evening', 'Evening'
        NIGHT = 'night', 'Night'
        FLEXIBLE = 'flexible', 'Flexible'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile'
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(max_length=100, blank=True, default='')
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    branch = models.ForeignKey(
        'businesses.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    shift = models.CharField(max_length=20, choices=Shift.choices, default=Shift.FLEXIBLE)
    hire_date = models.DateField(null=True, blank=True)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['business', 'branch']),
        ]

    def __str__(self):
        return f'{self.name} ({self.business.name})'


class EmployeeShift(AbstractBusinessModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    date = models.DateField()
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    notes = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Employee Shift'
        verbose_name_plural = 'Employee Shifts'
        indexes = [
            models.Index(fields=['employee', 'date']),
        ]

    def __str__(self):
        return f'{self.employee.name} - {self.date}'
