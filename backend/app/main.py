import hmac
import html
import json
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine, get_db
from .models import Position, Signal, utcnow
from .schemas import PositionOut, SignalOut, TVPayload
from .telegram import send_telegram

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("tradealert")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Demo shortcut. Replace with Alembic migrations before real production.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="TradeAlert API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_secret(given: str) -> None:
    if not hmac.compare_digest(given.encode(), settings.webhook_secret.encode()):
        raise HTTPException(status_code=401, detail="bad secret")


def _fmt(n: float | None) -> str:
    return "-" if n is None else f"{n:,.2f}"


def apply_signal(db: Session, p: TVPayload) -> tuple[str, float | None, str | None]:
    """Update position state. Returns (outcome, pnl_pct, telegram_text or None)."""
    pos = db.scalar(select(Position).where(Position.symbol == p.symbol, Position.strategy == p.strategy))
    if pos is None:
        pos = Position(symbol=p.symbol, strategy=p.strategy, status="FLAT")
        db.add(pos)

    sym = html.escape(p.symbol)
    strat = html.escape(p.strategy)
    pos.last_price = p.price

    if p.action == "BUY":
        if pos.status == "HOLD":
            return "DUPLICATE", None, None  # already in trade, don't spam client
        pos.status = "HOLD"
        pos.entry_price = p.price
        pos.entry_time = utcnow()
        text = f"🟢 <b>BUY</b> {sym} @ {_fmt(p.price)}\nStrategy: {strat}"
        if p.note:
            text += f"\nNote: {html.escape(p.note)}"
        return "NEW_POSITION", None, text

    # SELL
    if pos.status != "HOLD" or not pos.entry_price:
        return "IGNORED", None, None  # nothing to sell
    pnl = (p.price - pos.entry_price) / pos.entry_price * 100
    text = (
        f"🔴 <b>SELL</b> {sym} @ {_fmt(p.price)}\n"
        f"Entry: {_fmt(pos.entry_price)}  |  P&L: {pnl:+.2f}%\n"
        f"Strategy: {strat}"
    )
    if p.note:
        text += f"\nNote: {html.escape(p.note)}"
    pos.status = "FLAT"
    pos.entry_price = None
    pos.entry_time = None
    return "CLOSED", pnl, text


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/webhook/tradingview")
async def tradingview_webhook(request: Request, db: Session = Depends(get_db)):
    # TradingView sends text/plain unless message is valid JSON, so parse raw body ourselves.
    raw = (await request.body()).decode("utf-8", errors="replace")
    log.info("webhook hit: %s", raw[:500])

    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("json must be an object")
    except ValueError:
        raise HTTPException(status_code=400, detail="body is not valid JSON object")

    _check_secret(str(data.get("secret", "")))

    try:
        payload = TVPayload(**data)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json()))

    outcome, pnl, text = apply_signal(db, payload)

    sig = Signal(
        symbol=payload.symbol,
        strategy=payload.strategy,
        action=payload.action,
        price=payload.price,
        note=payload.note,
        outcome=outcome,
        pnl_pct=pnl,
        notified=False,
        # never store the secret
        raw=json.dumps({k: v for k, v in data.items() if k != "secret"}),
    )
    db.add(sig)
    db.commit()  # save state BEFORE notifying, so a Telegram failure never loses the signal

    if text:
        sig.notified = await send_telegram(text)
        db.commit()

    return {"status": "ok", "outcome": outcome, "notified": sig.notified}


@app.get("/api/signals", response_model=list[SignalOut])
def list_signals(limit: int = 50, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 500))
    return db.scalars(select(Signal).order_by(Signal.id.desc()).limit(limit)).all()


@app.get("/api/positions", response_model=list[PositionOut])
def list_positions(db: Session = Depends(get_db)):
    return db.scalars(select(Position).order_by(Position.symbol)).all()


@app.post("/api/summary")
async def send_hold_summary(
    x_webhook_secret: str = Header(default=""), db: Session = Depends(get_db)
):
    """Sends the 'what am I holding now' message. Call daily via cron later."""
    _check_secret(x_webhook_secret)
    holding = db.scalars(select(Position).where(Position.status == "HOLD").order_by(Position.symbol)).all()
    if not holding:
        text = "📊 <b>Daily summary</b>\nNo open positions."
    else:
        lines = ["📊 <b>Daily summary: HOLD</b>"]
        for h in holding:
            pnl = (
                (h.last_price - h.entry_price) / h.entry_price * 100
                if h.entry_price and h.last_price
                else 0.0
            )
            lines.append(
                f"• {html.escape(h.symbol)} ({html.escape(h.strategy)}): "
                f"entry {_fmt(h.entry_price)}, last {_fmt(h.last_price)}, {pnl:+.2f}%"
            )
        text = "\n".join(lines)
    ok = await send_telegram(text)
    return {"status": "ok", "notified": ok, "open_positions": len(holding)}
