import asyncio
import logging
import threading

from bot.config import BOT_TOKEN
from bot.main import build_application

logger = logging.getLogger(__name__)


class BotRunner:
    """Runs the Telegram bot Application on a dedicated event loop.

    The bot is used in webhook mode: Django receives updates via HTTP and
    dispatches them to this loop with ``process_update``. No polling is used,
    so the process plays nicely behind gunicorn on Render.
    """

    def __init__(self):
        self.loop = None
        self.app = None
        self._thread = None
        self._started = False

    def start(self):
        if self._started:
            return
        self._started = True
        self._thread = threading.Thread(
            target=self._run_loop, name='tg-bot-loop', daemon=True
        )
        self._thread.start()

    def _run_loop(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self.loop = loop
        if not BOT_TOKEN:
            logger.error('TELEGRAM_BOT_TOKEN is not set; bot disabled')
            return
        try:
            self.app = build_application(BOT_TOKEN)
            loop.run_until_complete(self.app.initialize())
            logger.info('Telegram bot application initialized in webhook mode')
        except Exception as exc:  # pragma: no cover - defensive startup
            logger.exception('Failed to initialize telegram bot: %s', exc)
            return
        loop.run_forever()

    def submit(self, update):
        if self.app is None or self.loop is None:
            logger.warning('Bot app not ready; dropping update')
            return
        future = asyncio.run_coroutine_threadsafe(
            self.app.process_update(update), self.loop
        )
        try:
            future.result(timeout=30)
        except Exception:
            logger.exception('Error while processing telegram update')


bot_runner = BotRunner()