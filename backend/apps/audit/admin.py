from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'action', 'model_name', 'object_id', 'ip_address', 'created_at')
    list_filter = ('action', 'model_name')
    search_fields = ('model_name', 'object_id', 'object_repr')
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'object_repr', 'changes', 'ip_address', 'user_agent', 'created_at')
