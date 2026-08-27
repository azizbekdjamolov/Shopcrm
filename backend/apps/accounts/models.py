import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_platform_admin', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = 'owner', _('Owner')
        ADMIN = 'admin', _('Admin')
        MANAGER = 'manager', _('Manager')
        SELLER = 'seller', _('Seller')
        COURIER = 'courier', _('Courier')
        CUSTOMER = 'customer', _('Customer')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True, default='')
    business_name = models.CharField(_('business name'), max_length=255, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_platform_admin = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='uz')
    preferred_theme = models.CharField(max_length=10, default='light', choices=[('light', 'Light'), ('dark', 'Dark')])
    telegram_user_id = models.CharField(max_length=50, blank=True, default='')
    telegram_username = models.CharField(max_length=100, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        ordering = ['-date_joined']
        verbose_name = _('user')
        verbose_name_plural = _('users')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return self.get_full_name() or self.email

    @property
    def is_business_owner(self):
        return self.role == self.Role.OWNER

    @property
    def is_business_admin(self):
        return self.role in [self.Role.OWNER, self.Role.ADMIN]
