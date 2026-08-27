from django.db import models

from .models import AuditLog


class AuditService:

    @staticmethod
    def log_action(user, action, model_name, object_id=None, object_repr='',
                   changes=None, business=None, ip_address=None, user_agent=''):
        if isinstance(changes, dict):
            serializable_changes = {}
            for key, value in changes.items():
                if isinstance(value, models.Model):
                    serializable_changes[key] = str(value.pk)
                elif hasattr(value, 'pk'):
                    serializable_changes[key] = str(value.pk)
                else:
                    try:
                        import json
                        json.dumps(value)
                        serializable_changes[key] = value
                    except (TypeError, ValueError):
                        serializable_changes[key] = str(value)
            changes = serializable_changes
        elif changes is None:
            changes = {}

        return AuditLog.objects.create(
            business=business,
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else '',
            object_repr=str(object_repr)[:255],
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else '',
        )

    @staticmethod
    def log_create(user, instance, business=None, ip_address=None, user_agent=''):
        return AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            model_name=instance.__class__.__name__,
            object_id=instance.pk,
            object_repr=str(instance),
            changes=_get_field_values(instance),
            business=business or getattr(instance, 'business', None),
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def log_update(user, instance, old_values, business=None, ip_address=None, user_agent=''):
        return AuditService.log_action(
            user=user,
            action=AuditLog.Action.UPDATE,
            model_name=instance.__class__.__name__,
            object_id=instance.pk,
            object_repr=str(instance),
            changes=old_values,
            business=business or getattr(instance, 'business', None),
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def log_delete(user, instance, business=None, ip_address=None, user_agent=''):
        return AuditService.log_action(
            user=user,
            action=AuditLog.Action.DELETE,
            model_name=instance.__class__.__name__,
            object_id=instance.pk,
            object_repr=str(instance),
            changes=_get_field_values(instance),
            business=business or getattr(instance, 'business', None),
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def get_model_history(business, model_name, object_id=None):
        logs = AuditLog.objects.filter(
            business=business, model_name=model_name, is_deleted=False
        ).select_related('user')
        if object_id:
            logs = logs.filter(object_id=str(object_id))
        return logs.order_by('-created_at')


def _get_field_values(instance):
    values = {}
    for field in instance._meta.fields:
        try:
            value = getattr(instance, field.name)
            if isinstance(value, models.Model):
                values[field.name] = str(value.pk)
            elif hasattr(value, 'pk'):
                values[field.name] = str(value.pk)
            else:
                import json
                try:
                    json.dumps(value)
                    values[field.name] = value
                except (TypeError, ValueError):
                    values[field.name] = str(value)
        except Exception:
            pass
    return values
