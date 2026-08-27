from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.contrib import admin


User = get_user_model()


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_platform_admin', 'is_active')
    list_filter = ('role', 'is_platform_admin', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'business_name', 'avatar', 'date_of_birth', 'address')}),
        ('Role & Permissions', {'fields': ('role', 'is_platform_admin', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Preferences', {'fields': ('preferred_language', 'preferred_theme')}),
        ('Telegram', {'fields': ('telegram_user_id', 'telegram_username')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role', 'is_active'),
        }),
    )
