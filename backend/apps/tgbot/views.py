import json
import logging
import random
from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from telegram import Update

from .models import PhoneVerification, TelegramPhoneLink, normalize_phone
from .runner import bot_runner

logger = logging.getLogger(__name__)


def _load_json(request):
    if request.method != 'POST':
        return None, JsonResponse({'ok': False, 'error': 'method not allowed'}, status=405)
    try:
        return json.loads(request.body or b'{}'), None
    except (ValueError, TypeError):
        return None, JsonResponse({'ok': False, 'error': 'invalid json'}, status=400)


def _validate_phone(payload) -> tuple:
    phone = normalize_phone(payload.get('phone', ''))
    if not phone.startswith('998') or len(phone) != 12:
        return None, JsonResponse(
            {'ok': False, 'error': 'invalid_phone',
             'message': "Telefon raqam +998 90 123 45 67 ko'rinishida bo'lishi kerak."},
            status=400,
        )
    return phone, None


@csrf_exempt
def phone_verify_request(request):
    """Generate a code and send it to the phone owner's Telegram chat."""
    payload, err = _load_json(request)
    if err:
        return err
    phone, err = _validate_phone(payload)
    if err:
        return err

    link = TelegramPhoneLink.objects.filter(phone=phone).first()
    if not link:
        return JsonResponse(
            {'ok': False, 'error': 'not_linked',
             'message': "Bu raqam Telegram botga ulanmagan. Telegram'da @BusinesForShopshopBot "
                        "ga kirib, '📱 Raqamni ulash' tugmasini bosing."},
            status=404,
        )

    code = f'{random.randint(0, 999999):06d}'
    PhoneVerification.objects.create(
        phone=phone,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    ok = bot_runner.send_message(
        chat_id=link.chat_id,
        text=f"🤖 Sizning tasdiqlash kodingiz: {code}\n\n"
             f"Kodni saytdagi maydonga kiriting. Kod 10 daqiqa ichida ishlatilishi kerak.",
    )
    if not ok:
        return JsonResponse(
            {'ok': False, 'error': 'send_failed', 'message': "Kodni Telegram'ga yuborib bo'lmadi."},
            status=502,
        )
    return JsonResponse({'ok': True})


@csrf_exempt
def phone_verify_confirm(request):
    payload, err = _load_json(request)
    if err:
        return err
    phone, err = _validate_phone(payload)
    if err:
        return err
    code = str(payload.get('code', '')).strip()
    if not code.isdigit() or len(code) != 6:
        return JsonResponse(
            {'ok': False, 'error': 'invalid_code', 'message': 'Kod 6 xonali son bo\'lishi kerak.'},
            status=400,
        )
    if not PhoneVerification.verify(phone, code):
        return JsonResponse(
            {'ok': False, 'error': 'invalid_code', 'message': "Kod noto'g'ri yoki muddati o'tgan."},
            status=400,
        )
    return JsonResponse({'ok': True, 'phone': f'+{phone}'})


@csrf_exempt
def webhook(request, secret):
    """Telegram webhook entry point.

    URL /api/tg/webhook/<secret>/ — secret is checked against
    TELEGRAM_WEBHOOK_SECRET to prevent unsolicited posts.
    """
    expected = settings.TELEGRAM_WEBHOOK_SECRET
    if not expected or secret != expected:
        return JsonResponse({'ok': False, 'error': 'invalid secret'}, status=404)

    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'method not allowed'}, status=405)

    try:
        payload = json.loads(request.body or b'{}')
    except (ValueError, TypeError):
        return JsonResponse({'ok': False, 'error': 'invalid json'}, status=400)

    bot_runner.start()
    if bot_runner.app is None:
        return JsonResponse({'ok': False, 'error': 'bot unavailable'}, status=503)

    update = Update.de_json(payload, bot_runner.app.bot)
    if update is None:
        return JsonResponse({'ok': True})

    result = bot_runner.submit(update)
    if result == 'error':
        return JsonResponse({'ok': False, 'error': bot_runner.last_error}, status=500)
    return JsonResponse({'ok': True})


def status(request):
    bot_runner.start()
    return JsonResponse(bot_runner.status())