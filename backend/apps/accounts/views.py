from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken
from django.conf import settings
from django.core import mail
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ProfileUpdateSerializer,
    SendVerificationCodeSerializer,
    VerifyVerificationCodeSerializer,
)
from .models import EmailVerification
from apps.core.exceptions import success_response

User = get_user_model()


def _send_verification_email(email: str, code: str) -> None:
    subject = 'Business OS - Verification code'
    body = f'Your verification code is: {code}\nIt expires in 10 minutes.'
    html = (
        '<div style="font-family:Arial,sans-serif;padding:24px;max-width:480px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px">'
        '<h2 style="margin:0 0 8px;color:#111827">Business OS</h2>'
        f'<p style="color:#374151;font-size:15px">Emailni tasdiqlash uchun quyidagi kodni kiriting:</p>'
        f'<div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#4f46e5;margin:12px 0">{code}</div>'
        f'<p style="color:#6b7280;font-size:13px">Kod 10 daqiqa amal qiladi. Email: {email}</p>'
        '</div>'
    )
    if getattr(settings, 'BREVO_API_KEY', ''):
        import requests
        resp = requests.post(
            'https://api.sendinblue.com/v3/smtp/email',
            headers={'api-key': settings.BREVO_API_KEY},
            json={
                'sender': {'email': settings.DEFAULT_FROM_EMAIL, 'name': 'Business OS'},
                'to': [{'email': email}],
                'subject': subject,
                'htmlContent': html,
                'textContent': body,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return
    if getattr(settings, 'EMAIL_API_KEY', ''):
        import requests
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {settings.EMAIL_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': settings.DEFAULT_FROM_EMAIL,
                'to': [email],
                'subject': subject,
                'html': html,
                'text': body,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return
    mail.send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=html,
        fail_silently=False,
    )


class SendVerificationCodeView(generics.GenericAPIView):
    serializer_class = SendVerificationCodeSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        record = EmailVerification.generate(email, purpose=EmailVerification.PURPOSE_REGISTER)
        try:
            _send_verification_email(record.email, record.code)
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception('Failed to send verification email to %s', email)
            return success_response(message='Failed to send email. Try again later.', status_code=status.HTTP_400_BAD_REQUEST)
        data = {'email': record.email}
        if settings.DEBUG:
            data['debug_code'] = record.code
        return success_response(data=data, message='Verification code sent')


class VerifyVerificationCodeView(generics.GenericAPIView):
    serializer_class = VerifyVerificationCodeSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        valid = EmailVerification.verify(
            data['email'], data['code'], purpose=EmailVerification.PURPOSE_REGISTER, consume=False
        )
        if not valid:
            return success_response(message='Invalid or expired code.', status_code=status.HTTP_400_BAD_REQUEST)
        return success_response(data={'email': data['email'], 'verified': True}, message='Code verified')


class RegisteredUsersView(generics.GenericAPIView):
    """Lists all active registered (non-admin) accounts so sellers can assign
    debt sales / pick a customer by email."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(is_active=True, is_platform_admin=False).order_by('email')
        data = [
            {
                'id': str(u.id),
                'email': u.email,
                'full_name': u.get_full_name() or u.email,
                'phone': u.phone or '',
            }
            for u in users
        ]
        return success_response(data=data)


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
