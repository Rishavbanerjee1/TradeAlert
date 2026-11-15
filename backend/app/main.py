import hmac
import html
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine, get_db
from .models import (
    Position,
    Signal,
    NotificationLog,
    Profile,
    utcnow,
)
from .schemas import (
    PositionOut,
    SignalOut,
    TVPayload,
    ManualNotificationIn,
    NotificationOut,
)
from .telegram import send_telegram


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("tradealert")


# ============================================================
# PROFILE SCHEMAS
# ============================================================

class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ProfileResponse(BaseModel):
    name: str
    updated_at: datetime


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Demo shortcut. Use Alembic migrations for production.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="TradeAlert API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

def _check_secret(given: str) -> None:
    if not hmac.compare_digest(
        given.encode(),
        settings.webhook_secret.encode(),
    ):
        raise HTTPException(
            status_code=401,
            detail="bad secret",
        )


def _fmt(n: float | None) -> str:
    return "-" if n is None else f"{n:,.2f}"


def get_or_create_profile(db: Session) -> Profile:
    profile = db.get(Profile, 1)

    if profile is None:
        profile = Profile(
            id=1,
            name="TradeAlert User",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {"ok": True}


# ============================================================
# PROFILE
# ============================================================

@app.get(
    "/api/profile",
    response_model=ProfileResponse,
)
def get_profile(db: Session = Depends(get_db)):
    try:
        return get_or_create_profile(db)
    except Exception:
        db.rollback()
        log.exception("Failed to retrieve profile")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve profile",
        )


@app.put(
    "/api/profile",
    response_model=ProfileResponse,
)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Name cannot be empty",
        )

    try:
        profile = get_or_create_profile(db)

        profile.name = name

        db.commit()
        db.refresh(profile)

        return profile

    except Exception:
        db.rollback()
        log.exception("Failed to update profile")
        raise HTTPException(
            status_code=500,
            detail="Unable to update profile",
        )


# ============================================================
# TRADINGVIEW SIGNAL PROCESSING
# ============================================================

def apply_signal(
    db: Session,
    p: TVPayload,
) -> tuple[str, float | None, str | None]:

    """Update position state. Returns (outcome, pnl_pct, telegram_text)."""

    pos = db.scalar(
        select(Position).where(
            Position.symbol == p.symbol,
            Position.strategy == p.strategy,
        )
    )

    if pos is None:
        pos = Position(
            symbol=p.symbol,
            strategy=p.strategy,
            status="FLAT",
        )
        db.add(pos)

    sym = html.escape(p.symbol)
    strat = html.escape(p.strategy)

    pos.last_price = p.price

    if p.action == "BUY":
        if pos.status == "HOLD":
            return "DUPLICATE", None, None

        pos.status = "HOLD"
        pos.entry_price = p.price
        pos.entry_time = utcnow()

        text = (
            f"🟢 <b>BUY</b> {sym} @ {_fmt(p.price)}\n"
            f"Strategy: {strat}"
        )

        if p.note:
            text += f"\nNote: {html.escape(p.note)}"

        return "NEW_POSITION", None, text

    # SELL
    if pos.status != "HOLD" or not pos.entry_price:
        return "IGNORED", None, None

    pnl = (
        (p.price - pos.entry_price)
        / pos.entry_price
        * 100
    )

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


@app.post("/webhook/tradingview")
async def tradingview_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    # TradingView may send text/plain, so parse raw body.
    raw = (
        await request.body()
    ).decode("utf-8", errors="replace")

    log.info("webhook hit: %s", raw[:500])

    try:
        data = json.loads(raw)

        if not isinstance(data, dict):
            raise ValueError("json must be an object")

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="body is not valid JSON object",
        )

    _check_secret(str(data.get("secret", "")))

    try:
        payload = TVPayload(**data)

    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=json.loads(e.json()),
        )

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
        raw=json.dumps({
            k: v
            for k, v in data.items()
            if k != "secret"
        }),
    )

    db.add(sig)

    # Save state before Telegram notification.
    db.commit()

    if text:
        delivery_status = await send_telegram(text)

        sig.notified = delivery_status == "sent"

        db.commit()

    return {
        "status": "ok",
        "outcome": outcome,
        "notified": sig.notified,
    }


# ============================================================
# SIGNALS
# ============================================================

@app.get(
    "/api/signals",
    response_model=list[SignalOut],
)
def list_signals(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 500))

    return db.scalars(
        select(Signal)
        .order_by(Signal.id.desc())
        .limit(limit)
    ).all()


# ============================================================
# POSITIONS
# ============================================================

@app.get(
    "/api/positions",
    response_model=list[PositionOut],
)
def list_positions(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Position)
        .order_by(Position.symbol)
    ).all()


# ============================================================
# TELEGRAM NOTIFICATIONS
# ============================================================

@app.post("/api/notifications/send")
async def send_manual_notification(
    payload: ManualNotificationIn,
    x_webhook_secret: str = Header(default=""),
    db: Session = Depends(get_db),
):
    _check_secret(x_webhook_secret)

    if payload.type == "custom":
        text = html.escape(payload.message.strip())

    else:
        symbol = html.escape(payload.symbol.upper())
        strategy = html.escape(
            payload.strategy or "Manual alert"
        )

        emoji = {
            "BUY": "🟢",
            "HOLD": "🟡",
            "SELL": "🔴",
        }[payload.action]

        text = (
            f"{emoji} <b>{payload.action}</b>\n"
            f"Symbol: {symbol}\n"
            f"Price: {_fmt(payload.price)}\n"
            f"Strategy: {strategy}\n"
            "\n<i>Manual alert via TradeAlert</i>"
        )

    delivery_status = await send_telegram(text)

    notification = NotificationLog(
        type=payload.type,
        message=text,
        action=(
            payload.action
            if payload.type == "signal"
            else None
        ),
        symbol=(
            payload.symbol.upper()
            if payload.symbol
            else None
        ),
        price=payload.price,
        strategy=(
            payload.strategy
            if payload.type == "signal"
            else None
        ),
        status=delivery_status,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "status": delivery_status,
        "message": (
            "Telegram message sent."
            if delivery_status == "sent"
            else (
                "Demo mode. Message was not delivered."
                if delivery_status == "demo"
                else "Telegram delivery failed."
            )
        ),
        "notification": NotificationOut.model_validate(
            notification
        ),
    }


@app.get(
    "/api/notifications/history",
    response_model=list[NotificationOut],
)
def get_notification_history(
    limit: int = 100,
    x_webhook_secret: str = Header(default=""),
    db: Session = Depends(get_db),
):
    _check_secret(x_webhook_secret)

    limit = max(1, min(limit, 500))

    return db.scalars(
        select(NotificationLog)
        .order_by(NotificationLog.created_at.desc())
        .limit(limit)
    ).all()


# ============================================================
# DAILY HOLD SUMMARY
# ============================================================

@app.post("/api/summary")
async def send_hold_summary(
    x_webhook_secret: str = Header(default=""),
    db: Session = Depends(get_db),
):
    """Sends the daily open-position summary."""

    _check_secret(x_webhook_secret)

    holding = db.scalars(
        select(Position)
        .where(Position.status == "HOLD")
        .order_by(Position.symbol)
    ).all()

    if not holding:
        text = (
            "📊 <b>Daily summary</b>\n"
            "No open positions."
        )

    else:
        lines = [
            "📊 <b>Daily summary: HOLD</b>"
        ]

        for h in holding:
            pnl = (
                (h.last_price - h.entry_price)
                / h.entry_price
                * 100
                if h.entry_price and h.last_price
                else 0.0
            )

            lines.append(
                f"• {html.escape(h.symbol)} "
                f"({html.escape(h.strategy)}): "
                f"entry {_fmt(h.entry_price)}, "
                f"last {_fmt(h.last_price)}, "
                f"{pnl:+.2f}%"
            )

        text = "\n".join(lines)

    delivery_status = await send_telegram(text)

    return {
        "status": delivery_status,
        "notified": delivery_status == "sent",
        "open_positions": len(holding),
    }