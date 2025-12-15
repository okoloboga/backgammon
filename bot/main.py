import asyncio
import logging
import os
from typing import Optional
from urllib.parse import urlencode

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://backgammon.ruble.website")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN env var is required")

bot = Bot(BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()


def build_launch_url(user_id: int, username: Optional[str], avatar_url: Optional[str]) -> str:
    params = {
        "telegram_id": user_id,
    }

    if username:
        params["username"] = username
    if avatar_url:
        params["avatar_url"] = avatar_url

    query = urlencode(params)
    base_url = MINI_APP_URL.rstrip("/")
    return f"{base_url}?{query}"


async def fetch_avatar_url(bot: Bot, user_id: int) -> Optional[str]:
    try:
        photos = await bot.get_user_profile_photos(user_id, limit=1)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to load profile photos: %s", exc)
        return None

    if not photos.total_count:
        return None

    file_id = photos.photos[0][0].file_id

    try:
        file = await bot.get_file(file_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to load profile photo file: %s", exc)
        return None

    return f"https://api.telegram.org/file/bot{bot.token}/{file.file_path}"


@dp.message(CommandStart())
async def on_start(message: Message) -> None:
    user = message.from_user
    if not user:
        await message.answer("Не удалось получить информацию о пользователе.")
        return

    avatar_url = await fetch_avatar_url(bot, user.id)
    launch_url = build_launch_url(user.id, user.username or user.full_name, avatar_url)

    kb = InlineKeyboardBuilder()
    kb.button(text="Открыть игру", web_app=WebAppInfo(url=launch_url))
    kb.button(text="Открыть в браузере", url=launch_url)

    await message.answer(
        "Жми кнопку, чтобы открыть нарды. Мы передадим твои данные в мини-приложение.",
        reply_markup=kb.as_markup(resize_keyboard=True),
    )


async def main() -> None:
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
