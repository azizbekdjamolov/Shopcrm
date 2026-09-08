import asyncio
import logging
from datetime import date

from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import (
    Application, CommandHandler, MessageHandler, ConversationHandler,
    ContextTypes, filters,
)

from bot.config import BOT_TOKEN, t
from bot.api_client import APIClient

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

api = APIClient()

EMAIL, PASSWORD = range(2)


def get_user_data(ctx: ContextTypes.DEFAULT_TYPE) -> dict:
    return ctx.user_data


def get_lang(ctx: ContextTypes.DEFAULT_TYPE) -> str:
    return ctx.user_data.get('lang', 'uz')


def main_keyboard(lang: str) -> ReplyKeyboardMarkup:
    buttons = [
        [KeyboardButton("Dashboard"), KeyboardButton("Orders")],
        [KeyboardButton("Sales"), KeyboardButton("Products")],
        [KeyboardButton("Stock"), KeyboardButton("Low Stock")],
        [KeyboardButton("Notifications"), KeyboardButton("Settings")],
    ]
    return ReplyKeyboardMarkup(buttons, resize_keyboard=True)


async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    lang = get_lang(ctx)
    args = ctx.args

    # Deep-link: /start <link_token> from the website "Connect Telegram" button.
    if args:
        link_token = args[0].strip()
        data = api.telegram_bot_auth(telegram_user_id=user.id, link_token=link_token)
        if data:
            ctx.user_data['token'] = data['tokens']['access']
            ctx.user_data['refresh_token'] = data['tokens']['refresh']
            ctx.user_data['business_id'] = data.get('business', {}).get('id', '') if isinstance(data.get('business'), dict) else ''
            ctx.user_data['business_name'] = data.get('business', {}).get('name', '') if isinstance(data.get('business'), dict) else ''
            ctx.user_data['user_name'] = data['user'].get('full_name', user.first_name)
            ctx.user_data['telegram_id'] = str(user.id)
            await update.message.reply_text(
                f"✅ {t('linked_success', lang)}\n"
                f"👤 {ctx.user_data['user_name']}\n"
                f"🏢 {ctx.user_data['business_name'] or 'N/A'}"
            )
            ctx.user_data['fresh'] = True
            await update.message.reply_text(
                t('welcome', lang), reply_markup=main_keyboard(lang),
            )
            return
        else:
            await update.message.reply_text(t('link_failed', lang))

    # If a previously linked telegram account exists, auto-login.
    if ctx.user_data.get('token'):
        await update.message.reply_text(
            f"Salom, {user.first_name}! {t('welcome', lang)}",
            reply_markup=main_keyboard(lang),
        )
    else:
        data = api.telegram_bot_auth(telegram_user_id=user.id)
        if data:
            ctx.user_data['token'] = data['tokens']['access']
            ctx.user_data['refresh_token'] = data['tokens']['refresh']
            ctx.user_data['business_id'] = data.get('business', {}).get('id', '') if isinstance(data.get('business'), dict) else ''
            ctx.user_data['business_name'] = data.get('business', {}).get('name', '') if isinstance(data.get('business'), dict) else ''
            ctx.user_data['user_name'] = data['user'].get('full_name', user.first_name)
            ctx.user_data['telegram_id'] = str(user.id)
            await update.message.reply_text(
                f"Salom, {user.first_name}! {t('welcome', lang)}",
                reply_markup=main_keyboard(lang),
            )
        else:
            await update.message.reply_text(
                f"Salom, {user.first_name}! {t('welcome', lang)}\n\n"
                f"Tizimga kirish uchun: /login\n"
                f"Yordam: /help",
            )


async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    await update.message.reply_text(t('help', lang))


async def login_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    lang = get_lang(ctx)
    await update.message.reply_text(t('login_prompt', lang))
    return EMAIL


async def login_email(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data['temp_email'] = update.message.text.strip()
    lang = get_lang(ctx)
    await update.message.reply_text(t('password_prompt', lang))
    return PASSWORD


async def login_password(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    email = ctx.user_data.pop('temp_email', '')
    password = update.message.text.strip()
    lang = get_lang(ctx)

    data = api.login(email, password)
    if data:
        ctx.user_data['token'] = data['tokens']['access']
        ctx.user_data['refresh_token'] = data['tokens']['refresh']
        ctx.user_data['business_id'] = data['business']['id']
        ctx.user_data['business_name'] = data['business'].get('name', '')
        ctx.user_data['user_name'] = data['user'].get('full_name', email)
        await update.message.reply_text(
            f"{t('login_success', lang)}\n"
            f"Business: {data['business'].get('name', 'N/A')}",
            reply_markup=main_keyboard(lang),
        )
    else:
        await update.message.reply_text(t('login_failed', lang))

    return ConversationHandler.END


async def login_cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    return ConversationHandler.END


async def logout(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    ctx.user_data.clear()
    ctx.user_data['lang'] = lang
    await update.message.reply_text(
        t('logout_success', lang),
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("/start")]], resize_keyboard=True),
    )


async def dashboard(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    today = date.today().isoformat()
    sales = api.get_sales_report(data['token'], data['business_id'], today)
    profit = api.get_profit_report(data['token'], data['business_id'], today)
    low_stock = api.get_low_stock(data['token'], data['business_id'])

    text = f"📊 *{t('dashboard_title', lang)}*\n\n"
    text += f"💰 {t('today_sales', lang)}: *{format_num(sales.get('total_sales', 0))} {t('currency', lang)}*\n"
    text += f"🛒 {t('today_orders', lang)}: *{sales.get('total_orders', 0)}*\n"
    text += f"📈 {t('profit', lang)}: *{format_num(profit.get('gross_profit', 0))} {t('currency', lang)}*\n"
    text += f"📦 {t('total_products', lang)}: *{sales.get('total_orders', 0)}*\n"
    text += f"⚠️ {t('low_stock', lang)}: *{len(low_stock) if low_stock else 0}*\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def orders(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    orders_list = api.get_orders(data['token'], data['business_id'])

    if not orders_list:
        await update.message.reply_text(f"📋 {t('orders_title', lang)}\n\n{t('no_data', lang)}")
        return

    text = f"📋 *{t('orders_title', lang)}*\n\n"
    for o in orders_list[:10]:
        status = o.get('status', 'N/A')
        total = o.get('total_amount', 0)
        num = o.get('order_number', o.get('id', 'N/A')[:8])
        text += f"#{num} | {status} | {format_num(total)} {t('currency', lang)}\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def sales(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    sales_list = api.get_sales(data['token'], data['business_id'])

    if not sales_list:
        await update.message.reply_text(f"💰 {t('sales_title', lang)}\n\n{t('no_data', lang)}")
        return

    text = f"💰 *{t('sales_title', lang)}*\n\n"
    for s in sales_list[:10]:
        total = s.get('total_amount', 0)
        method = s.get('payment_method', 'N/A')
        created = s.get('created_at', '')[:10]
        text += f"{created} | {format_num(total)} {t('currency', lang)} | {method}\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def products(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    products_list = api.get_products(data['token'], data['business_id'])

    if not products_list:
        await update.message.reply_text(f"📦 {t('products_title', lang)}\n\n{t('no_products', lang)}")
        return

    text = f"📦 *{t('products_title', lang)}*\n\n"
    for p in products_list[:10]:
        name = p.get('name', 'N/A')
        price = p.get('selling_price', 0)
        stock = p.get('quantity', p.get('stock_quantity', 0))
        text += f"• {name} | {format_num(price)} {t('currency', lang)} | {stock} dona\n"

    if len(products_list) > 10:
        text += f"\n... va yana {len(products_list) - 10} ta"

    await update.message.reply_text(text, parse_mode='Markdown')


async def stock(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    products_list = api.get_products(data['token'], data['business_id'])

    if not products_list:
        await update.message.reply_text(f"📦 {t('stock_title', lang)}\n\n{t('no_data', lang)}")
        return

    text = f"📦 *{t('stock_title', lang)}*\n\n"
    for p in products_list[:15]:
        name = p.get('name', 'N/A')
        stock = p.get('quantity', p.get('stock_quantity', 0))
        emoji = "✅" if stock > 0 else "❌"
        text += f"{emoji} {name}: {stock} dona\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def low_stock(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    items = api.get_low_stock(data['token'], data['business_id'])

    if not items:
        await update.message.reply_text(f"⚠️ {t('low_stock_title', lang)}\n\n{t('no_data', lang)}")
        return

    text = f"⚠️ *{t('low_stock_title', lang)}*\n\n"
    for p in items:
        name = p.get('name', 'N/A')
        stock = p.get('quantity', p.get('stock_quantity', 0))
        min_stock = p.get('min_stock', p.get('minimum_stock', 0))
        text += f"🔴 {name}: {stock}/{min_stock}\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def notifications(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if not data.get('token'):
        await update.message.reply_text(t('not_logged_in', lang))
        return

    items = api.get_notifications(data['token'], data['business_id'])

    if not items:
        await update.message.reply_text(f"🔔 {t('notifications_title', lang)}\n\n{t('no_notifications', lang)}")
        return

    text = f"🔔 *{t('notifications_title', lang)}*\n\n"
    for n in items[:10]:
        title = n.get('title', 'N/A')
        message = n.get('message', '')[:60]
        text += f"• {title}\n  {message}\n\n"

    await update.message.reply_text(text, parse_mode='Markdown')


async def settings(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    data = get_user_data(ctx)

    if data.get('token'):
        text = (
            f"⚙️ *Settings*\n\n"
            f"👤 {data.get('user_name', 'N/A')}\n"
            f"🏢 {data.get('business_name', 'N/A')}\n"
            f"🌐 Language: {lang.upper()}\n\n"
            f"/lang - Tilni o'zgartirish\n"
            f"/logout - Chiqish"
        )
    else:
        text = t('not_logged_in', lang)

    await update.message.reply_text(text, parse_mode='Markdown')


async def lang_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    buttons = [
        [KeyboardButton("O'zbek"), KeyboardButton("Русский"), KeyboardButton("English")],
    ]
    await update.message.reply_text(
        "Tilni tanlang / Выберите язык / Choose language:",
        reply_markup=ReplyKeyboardMarkup(buttons, resize_keyboard=True),
    )


async def handle_lang_choice(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text.strip().lower()
    lang_map = {"o'zbek": 'uz', 'uzbek': 'uz', 'русский': 'ru', 'russian': 'ru', 'english': 'en', 'ingliz': 'en'}

    if text in lang_map:
        lang = lang_map[text]
        ctx.user_data['lang'] = lang
        await update.message.reply_text(
            t('lang_changed', lang),
            reply_markup=main_keyboard(lang),
        )


def format_num(n) -> str:
    try:
        return f"{float(n):,.0f}"
    except (ValueError, TypeError):
        return str(n)


async def unknown_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_lang(ctx)
    if ctx.user_data.get('token'):
        await update.message.reply_text(t('help', lang), reply_markup=main_keyboard(lang))
    else:
        await update.message.reply_text(
            f"Tizimga kirish uchun: /start\n"
            f"Login: /login\n"
            f"Yordam: /help"
        )


def build_application(token: str = BOT_TOKEN):
    app = Application.builder().token(token).build()

    login_conv = ConversationHandler(
        entry_points=[CommandHandler('login', login_start)],
        states={
            EMAIL: [MessageHandler(filters.TEXT & ~filters.COMMAND, login_email)],
            PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, login_password)],
        },
        fallbacks=[CommandHandler('cancel', login_cancel)],
    )

    app.add_handler(CommandHandler('start', start))
    app.add_handler(CommandHandler('help', help_cmd))
    app.add_handler(login_conv)
    app.add_handler(CommandHandler('logout', logout))
    app.add_handler(CommandHandler('dashboard', dashboard))
    app.add_handler(CommandHandler('orders', orders))
    app.add_handler(CommandHandler('sales', sales))
    app.add_handler(CommandHandler('products', products))
    app.add_handler(CommandHandler('stock', stock))
    app.add_handler(CommandHandler('lowstock', low_stock))
    app.add_handler(CommandHandler('notifications', notifications))
    app.add_handler(CommandHandler('settings', settings))
    app.add_handler(CommandHandler('lang', lang_cmd))

    app.add_handler(MessageHandler(
        filters.Regex("^(O'zbek|Русский|English)$"),
        handle_lang_choice,
    ))

    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND & ~filters.Regex("^(O'zbek|Русский|English)$"),
        unknown_text,
    ))

    return app


def main() -> None:
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return

    app = build_application()

    logger.info("Telegram bot is starting...")
    app.run_polling(drop_pending_updates=True)


if __name__ == '__main__':
    main()
