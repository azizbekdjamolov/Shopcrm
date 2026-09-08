from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('send-verification-code/', views.SendVerificationCodeView.as_view(), name='send-verification-code'),
    path('verify-verification-code/', views.VerifyVerificationCodeView.as_view(), name='verify-verification-code'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.MeView.as_view(), name='me'),
    path('registered-users/', views.RegisteredUsersView.as_view(), name='registered-users'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('telegram/connect/', views.TelegramConnectView.as_view(), name='telegram-connect'),
    path('telegram/link-token/', views.TelegramLinkTokenView.as_view(), name='telegram-link-token'),
    path('telegram/bot-auth/', views.TelegramBotAuthView.as_view(), name='telegram-bot-auth'),
]
