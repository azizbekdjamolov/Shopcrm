import uuid
import json
from django.db import models
from django.conf import settings
from apps.core.models import AbstractBusinessModel


class AuditLog(AbstractBusinessModel):
    class Action(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        VIEW = 'view', 'View'
        EXPORT = 'export', 'Export'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=Action.choices, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    object_id = models.CharField(max_length=100, blank=True, default='')
    object_repr = models.CharField(max_length=255, blank=True, default='')
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')

    class Meta(AbstractBusinessModel.Meta):
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['business', 'created_at']),
        ]

    def __str__(self):
        return f'{self.user} - {self.action} - {self.model_name}'
