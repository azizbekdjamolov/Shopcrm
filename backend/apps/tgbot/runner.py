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
        self._ready = threading.Event()
        self._started = False
        self.last_error = ''
        self.processed_count = 0
        self.error_count = 0

    def status(self) -> dict:
        return {
            'ready': self._ready.is_set(),
            'started': self._started,
            'token_set': bool(BOT_TOKEN),
            'app_set': self.app is not None,
            'processed_count': self.processed_count,
            'error_count': self.error_count,
            'last_error': self.last_error[:400],
        }

    def start(self):
        """Start (idempotently) and block until the app is ready."""
        if self._started:
            self._ready.wait(timeout=30)
            return self.app is not None
        self._started = True
        self._thread = threading.Thread(
            target=self._run_loop, name='tg-bot-loop', daemon=True
        )
        self._thread.start()
        if not self._ready.wait(timeout=30):
            logger.error('Telegram bot did not become ready within 30s')
        return self.app is not None

    def _run_loop(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self.loop = loop
        try:
            if not BOT_TOKEN:
                logger.error('TELEGRAM_BOT_TOKEN is not set; bot disabled')
                return
            app = build_application(BOT_TOKEN)
            loop.run_until_complete(app.initialize())
            self.app = app
            logger.info('Telegram bot application initialized in webhook mode')
        except Exception:  # pragma: no cover - defensive startup
            logger.exception('Failed to initialize telegram bot')
            return
        finally:
            self._ready.set()
        loop.run_forever()

    def send_message(self, chat_id, text, **kwargs) -> bool:
        """Send a message to a chat from the bot's event loop (thread-safe)."""
        if self.app is None or self.loop is None:
            logger.warning('Bot app not ready; cannot send message')
            self.last_error = 'Bot app not ready'
            return False
        coro = self.app.bot.send_message(chat_id=chat_id, text=text, **kwargs)
        future = asyncio.run_coroutine_threadsafe(coro, self.loop)
        try:
            future.result(timeout=30)
            return True
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception('Bot send_message failed')
            self.error_count += 1
            self.last_error = f'{type(exc).__name__}: {exc}'
            return False

    def submit(self, update):
        if self.app is None or self.loop is None:
            logger.warning('Bot app not ready; dropping update')
            self.last_error = 'Bot app not ready'
            return 'not_ready'
        future = asyncio.run_coroutine_threadsafe(
            self.app.process_update(update), self.loop
        )
        try:
            future.result(timeout=30)
            self.processed_count += 1
            return 'ok'
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception('Error while processing telegram update')
            self.error_count += 1
            self.last_error = f'{type(exc).__name__}: {exc}'
            return 'error'


bot_runner = BotRunner()