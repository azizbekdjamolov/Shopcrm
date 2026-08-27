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
        if not telegram_username:
            return Response({'error': 'telegram_username is required'}, status=status.HTTP_400_BAD_REQUEST)
        if telegram_username.startswith('@'):
            telegram_username = telegram_username[1:]
        request.user.telegram_username = telegram_username
        request.user.save(update_fields=['telegram_username'])
        return success_response(data={'telegram_username': telegram_username})

    def delete(self, request):
        request.user.telegram_username = ''
        request.user.save(update_fields=['telegram_username'])
        return success_response(data={'telegram_username': ''})
