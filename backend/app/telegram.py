import logging

import httpx

from .config import settings

log = logging.getLogger("tradealert.telegram")


async def send_telegram(text: str) -> bool:
    """Send a message. Returns True on success.

    Demo mode: if token/chat id missing, just log the message and return True,
    so the whole flow can be shown without a real bot.
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        log.warning("[DEMO MODE - telegram not configured] would send:\n%s", text)
        return True

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    body = {"chat_id": settings.telegram_chat_id, "text": text, "parse_mode": "HTML"}

    for attempt in (1, 2, 3):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(url, json=body)
            if r.status_code == 200:
                return True
            log.error("telegram attempt %s failed: %s %s", attempt, r.status_code, r.text)
        except httpx.HTTPError as e:
            log.error("telegram attempt %s error: %s", attempt, e)
    return False
