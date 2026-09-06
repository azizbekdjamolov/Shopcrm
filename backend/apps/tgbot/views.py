import json
import logging

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from telegram import Update

from .runner import bot_runner

logger = logging.getLogger(__name__)


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