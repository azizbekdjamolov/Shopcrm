from django.utils.deprecation import MiddlewareMixin

from .services import AuditService


class AuditMiddleware(MiddlewareMixin):

    def process_request(self, request):
        request._ip_address = self._get_client_ip(request)
        request._user_agent = request.META.get('HTTP_USER_AGENT', '')
        request._audit_ip = request._ip_address
        request._audit_user_agent = request._user_agent

    def process_view(self, request, view_func, view_args, view_kwargs):
        return None

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
