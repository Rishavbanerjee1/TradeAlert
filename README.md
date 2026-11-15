# TradeAlert

TradingView strategy alerts → webhook → Postgres → Telegram message (BUY / SELL / HOLD summary).

```
/backend    FastAPI + SQLAlchemy + Postgres   (Dev A)
/frontend   dashboard                         (Dev B)
```

## Run backend locally

```bash
docker compose up -d                 # Postgres on :5432
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # edit WEBHOOK_SECRET, optional Telegram vars
uvicorn app.main:app --reload
```

- Swagger docs (Dev B uses this as API contract): http://localhost:8000/docs
- No Telegram token set = DEMO MODE, messages print in the uvicorn console.

## Try it

```bash
bash backend/demo_alerts.sh http://localhost:8000 <your WEBHOOK_SECRET>
```

## Telegram setup (5 min)

1. Telegram → @BotFather → `/newbot` → copy token into `TELEGRAM_BOT_TOKEN`.
2. Open your new bot, press Start, send "hi".
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` → copy `message.chat.id` into `TELEGRAM_CHAT_ID`.
4. Restart uvicorn, run demo script again.

## TradingView alert message (paste in alert's Message box)

```json
{
  "secret": "YOUR_WEBHOOK_SECRET",
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "strategy": "My Strategy Name"
}
```

Webhook URL: `https://<your-deployed-host>/webhook/tradingview`
(`{{strategy.order.action}}` gives `buy`/`sell`, server uppercases it.
For `alertcondition()` scripts hardcode `"action": "BUY"` in separate alerts.)

## API (for frontend)

| Method | Path | Notes |
|---|---|---|
| POST | /webhook/tradingview | TradingView only, needs `secret` |
| GET | /api/signals?limit=50 | newest first |
| GET | /api/positions | status HOLD / FLAT |
| POST | /api/summary | header `X-Webhook-Secret`, sends hold summary to Telegram |
| GET | /health | uptime check |

## Git workflow

`main` protected. Branch per task (`feat/xyz`), PR, other dev reviews, merge. `git pull origin main` every morning.

## TODO (not in demo)

- Alembic migrations (now `create_all` on startup)
- Login for `/api/*` (currently open)
- Daily summary cron
- WhatsApp
- Broker execution (Phase 3)
