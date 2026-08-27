from django.utils.deprecation import MiddlewareMixin


class BusinessMiddleware(MiddlewareMixin):

    def process_request(self, request):
        request.business = None
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            self._try_jwt_auth(request)
            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                return

        self._resolve_business(request, user)

    def _resolve_business(self, request, user):
        business_id = request.headers.get('X-Business-ID') or request.GET.get('business_id')

        if business_id:
            from apps.businesses.models import Business, BusinessUser
            if user.is_platform_admin:
                request.business = Business.objects.filter(id=business_id, is_active=True).first()
            else:
                bu = BusinessUser.objects.filter(
                    user=user, business_id=business_id, is_active=True
                ).select_related('business').first()
                if bu:
                    request.business = bu.business
        else:
            from apps.businesses.models import BusinessUser
            bu = BusinessUser.objects.filter(
                user=user, is_active=True
            ).select_related('business').order_by('-role').first()
            if bu:
                request.business = bu.business
            elif user.is_platform_admin:
                from apps.businesses.models import Business
                request.business = Business.objects.filter(is_active=True).first()
            else:
                request.business = user.owned_businesses.filter(is_active=True).first()

    def _try_jwt_auth(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return

        token = auth_header.split(' ', 1)[1]
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from apps.accounts.models import User

            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id, is_active=True)
            request.user = user
        except Exception:
            pass
