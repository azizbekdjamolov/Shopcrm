from django.contrib import admin
from .models import Employee, EmployeeShift


class EmployeeShiftInline(admin.TabularInline):
    model = EmployeeShift
    extra = 0


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'role', 'salary', 'status', 'shift', 'branch', 'hire_date')
    list_filter = ('status', 'shift')
    search_fields = ('name', 'phone')
    inlines = [EmployeeShiftInline]


@admin.register(EmployeeShift)
class EmployeeShiftAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'shift_start', 'shift_end')
    list_filter = ('date',)
