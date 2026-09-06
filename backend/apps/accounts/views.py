from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ProfileUpdateSerializer,
)
from apps.core.exceptions import success_response

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        business_data = None
        from apps.businesses.models import BusinessUser
        bu = BusinessUser.objects.filter(user=user, is_active=True).select_related('business').first()
        if bu:
            business_data = {
                'id': str(bu.business.id),
                'name': bu.business.name,
                'slug': bu.business.slug,
            }
        return success_response(
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'business': business_data,
            },
            message='Registration successful',
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        business_data = None
        from apps.businesses.models import BusinessUser
        bu = BusinessUser.objects.filter(user=user, is_active=True).select_related('business').first()
        if bu:
            business_data = {
                'id': str(bu.business.id),
                'name': bu.business.name,
                'slug': bu.business.slug,
            }
        return success_response(
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'business': business_data,
            },
            message='Login successful',
        )


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            else:
                for token in OutstandingToken.objects.filter(user=request.user):
                    BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass
        return success_response(message='Logged out successfully')


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return success_response(data=serializer.data)

    def update(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserSerializer(request.user).data,
            message='Profile updated successfully',
        )


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(message='Password changed successfully')


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(message='Password reset email sent if account exists.')


class TelegramConnectView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        telegram_username = request.data.get('telegram_username', '').strip()
        telegram_user_id = str(request.data.get('telegram_user_id', '')).strip()
        if telegram_username.startswith('@'):
            telegram_username = telegram_username[1:]
        if not telegram_username and not telegram_user_id:
            return Response({'error': 'telegram_username or telegram_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if telegram_username:
            request.user.telegram_username = telegram_username
        if telegram_user_id:
            request.user.telegram_user_id = telegram_user_id
        request.user.save(update_fields=['telegram_username', 'telegram_user_id'])
        return success_response(data={
            'telegram_username': request.user.telegram_username,
            'telegram_user_id': request.user.telegram_user_id,
        })

    def delete(self, request):
        request.user.telegram_username = ''
        request.user.telegram_user_id = ''
        request.user.save(update_fields=['telegram_username', 'telegram_user_id'])
        return success_response(data={'telegram_username': '', 'telegram_user_id': ''})


class TelegramLinkTokenView(generics.GenericAPIView):
    """Returns (and rotates) a deep-link token used to auto-link the Telegram bot."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import secrets
        request.user.tg_link_token = secrets.token_urlsafe(32)
        request.user.save(update_fields=['tg_link_token'])
        return success_response(data={'link_token': request.user.tg_link_token})


class TelegramBotAuthView(generics.GenericAPIView):
    """Exchanges a Telegram chat id (or one-time link token) for user JWT tokens.

    Used by the bot so a user who linked their account via the deep link can
    act without re-entering credentials.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        telegram_user_id = str(request.data.get('telegram_user_id', '')).strip()
        link_token = str(request.data.get('link_token', '')).strip()
        from apps.accounts.models import User

        user = None
        # Link-token path: bind the tg id to the user permanently.
        if link_token:
            user = User.objects.filter(tg_link_token=link_token).first()
            if user is None:
                return Response({'error': 'Invalid or expired link token'}, status=status.HTTP_400_BAD_REQUEST)
            if telegram_user_id:
                user.telegram_user_id = telegram_user_id
                user.save(update_fields=['telegram_user_id'])
            user.tg_link_token = ''
            user.save(update_fields=['tg_link_token'])
        elif telegram_user_id:
            user = User.objects.filter(telegram_user_id=telegram_user_id).first()

        if user is None:
            return Response({'error': 'Telegram account is not linked'}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        business_data = None
        from apps.businesses.models import BusinessUser
        bu = BusinessUser.objects.filter(user=user, is_active=True).select_related('business').first()
        if bu:
            business_data = {
                'id': str(bu.business.id),
                'name': bu.business.name,
                'slug': bu.business.slug,
            }
        return success_response(data={
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'business': business_data,
        })
