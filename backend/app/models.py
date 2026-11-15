from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Signal(Base):
    """Every alert received from TradingView. Append-only audit log."""

    __tablename__ = "signals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    symbol: Mapped[str] = mapped_column(String(40), index=True)
    strategy: Mapped[str] = mapped_column(String(80), default="default")
    action: Mapped[str] = mapped_column(String(10))
    price: Mapped[float] = mapped_column(Float)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), default="NEW_POSITION")
    pnl_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)
    raw: Mapped[str | None] = mapped_column(Text, nullable=True)


class Position(Base):
    """Current state per (symbol, strategy)."""

    __tablename__ = "positions"
    __table_args__ = (
        UniqueConstraint("symbol", "strategy", name="uq_symbol_strategy"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(40), index=True)
    strategy: Mapped[str] = mapped_column(String(80), default="default")
    status: Mapped[str] = mapped_column(String(10), default="FLAT")
    entry_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    entry_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class NotificationLog(Base):
    """History of manually composed Telegram notification attempts."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )

    type: Mapped[str] = mapped_column(String(20))  # custom / signal
    message: Mapped[str] = mapped_column(Text)

    action: Mapped[str | None] = mapped_column(String(10), nullable=True)
    symbol: Mapped[str | None] = mapped_column(String(40), nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    strategy: Mapped[str | None] = mapped_column(String(100), nullable=True)

    status: Mapped[str] = mapped_column(String(20))  # sent / demo / failed