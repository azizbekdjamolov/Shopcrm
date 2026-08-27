from django.contrib import admin
from .models import Business, BusinessUser, Branch


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'owner__email')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BusinessUser)
class BusinessUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active')
    search_fields = ('user__email', 'business__name')


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'is_main', 'is_active')
    list_filter = ('is_main', 'is_active')
    search_fields = ('name', 'business__name')
