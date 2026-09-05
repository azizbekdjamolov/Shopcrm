import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.core.utils import generate_unique_slug


class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_businesses')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    logo = models.ImageField(upload_to='businesses/logos/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    website = models.URLField(blank=True, default='')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class BusinessUser(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MANAGER = 'manager', 'Manager'
        SELLER = 'seller', 'Seller'
        COURIER = 'courier', 'Courier'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business_roles')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='business_users')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SELLER)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-joined_at']
        unique_together = ('user', 'business')
        verbose_name = 'Business User'
        verbose_name_plural = 'Business Users'
        indexes = [
            models.Index(fields=['business', 'role']),
        ]

    def __str__(self):
        return f'{self.user} - {self.business} ({self.role})'


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_main', 'name']
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} ({self.business.name})'

    def save(self, *args, **kwargs):
        if self.is_main:
            Branch.objects.filter(
                business=self.business, is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)


class BusinessSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='settings')
    extra_data = models.JSONField(default=dict, blank=True)
    store_name = models.CharField(max_length=255, blank=True, default='', help_text='Public store name shown in the marketplace')
    is_public = models.BooleanField(default=False, help_text='Show store on public marketplace')
    delivery_enabled = models.BooleanField(default=False, help_text='Enable delivery for this store')
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Delivery fee in UZS')
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Minimum order for delivery')
    store_description = models.TextField(blank=True, default='', help_text='Public store description')
    store_phone = models.CharField(max_length=20, blank=True, default='')
    store_address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Business Settings'
        verbose_name_plural = 'Business Settings'

    def __str__(self):
        return f'Settings for {self.business.name}'
