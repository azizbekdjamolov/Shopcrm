import re
import uuid
from django.utils.text import slugify


def generate_slug(text):
    slug = slugify(text, allow_unicode=False)
    if not slug:
        slug = str(uuid.uuid4())[:8]
    return slug


def generate_unique_slug(instance, text, field='slug', exclude_pk=None):
    slug = generate_slug(text)
    model_class = instance.__class__
    queryset = model_class.objects.all()
    if exclude_pk:
        queryset = queryset.exclude(pk=exclude_pk)
    counter = 1
    original_slug = slug
    while queryset.filter(**{field: slug}).exists():
        slug = f'{original_slug}-{counter}'
        counter += 1
    return slug


def format_currency(amount):
    """Format amount in Uzbekistan So'm (UZS)."""
    if amount is None:
        return '0 so\'m'
    formatted = f'{amount:,.0f}'
    return f'{formatted} so\'m'


def generate_order_number(prefix='ORD'):
    import datetime
    now = datetime.datetime.now()
    date_part = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4())[:6].upper()
    return f'{prefix}-{date_part}-{random_part}'


def generate_invoice_number(prefix='INV'):
    import datetime
    now = datetime.datetime.now()
    date_part = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4())[:6].upper()
    return f'{prefix}-{date_part}-{random_part}'


def generate_sale_number(prefix='SL'):
    import datetime
    now = datetime.datetime.now()
    date_part = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4())[:6].upper()
    return f'{prefix}-{date_part}-{random_part}'


def validate_phone(value):
    import phonenumbers
    try:
        parsed = phonenumbers.parse(value, 'UZ')
        if not phonenumbers.is_valid_number(parsed):
            return False
        return True
    except phonenumbers.NumberParseException:
        return False


def format_phone(value):
    import phonenumbers
    try:
        parsed = phonenumbers.parse(value, 'UZ')
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except phonenumbers.NumberParseException:
        return value
