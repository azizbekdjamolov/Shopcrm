import uuid
from django.db import models
from django.utils import timezone


def normalize_phone(phone) -> str:
    """Return canonical digits-only form, e.g. '998901377137'."""
    digits = ''.join(ch for ch in str(phone or '') if ch.isdigit())
    if digits.startswith('8') and digits[1:2] == '9':
        digits = '998' + digits[1:]
    if digits.startswith('998') and len(digits) == 12:
        return digits
    if len(digits) == 9 and digits.startswith('9'):
        return '998' + digits
    return digits


class TelegramPhoneLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    telegram_user_id = models.BigIntegerField()
    telegram_username = models.CharField(max_length=255, blank=True, default='')
    chat_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Telegram Phone Link'
        verbose_name_plural = 'Telegram Phone Links'

    def __str__(self):
        return f'{self.phone} -> tg {self.chat_id}'


class PhoneVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Phone Verification'
        verbose_name_plural = 'Phone Verifications'

    def __str__(self):
        return f'{self.phone} {self.code} verified={self.verified}'

    @classmethod
    def verify(cls, phone, code) -> bool:
        now = timezone.now()
        obj = (
            cls.objects.filter(phone=phone, code=code, verified=False, expires_at__gt=now)
            .order_by('-created_at')
            .first()
        )
        if obj:
            obj.verified = True
            obj.save(update_fields=['verified'])
        return obj is not None