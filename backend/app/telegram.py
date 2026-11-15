import logging
import httpx

from .config import settings

log = logging.getLogger("tradealert.telegram")


async def send_telegram(text: str) -> str:
    """
    Returns:
      sent   - Telegram confirmed delivery
      demo   - Telegram is not configured; message was only logged
      failed - Telegram delivery failed
    """

    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        log.warning(
            "[DEMO MODE - NOT DELIVERED TO TELEGRAM]\n%s",
            text,
        )
        return "demo"

    url = (
        f"https://api.telegram.org/"
        f"bot{settings.telegram_bot_token}/sendMessage"
    )

    body = {
        "chat_id": settings.telegram_chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=body)

            data = response.json()

            if response.status_code == 200 and data.get("ok"):
                return "sent"

            log.error(
                "Telegram attempt %s failed: %s",
                attempt,
                data,
            )

        except (httpx.HTTPError, ValueError) as error:
            log.error(
                "Telegram attempt %s error: %s",
                attempt,
                error,
            )

    return "failed"