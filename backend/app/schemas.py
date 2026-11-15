from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class TVPayload(BaseModel):
    """JSON that the TradingView alert message must send."""

    secret: str
    symbol: str
    action: str  # BUY or SELL
    price: float
    strategy: str = "default"
    note: str | None = None

    @field_validator("action")
    @classmethod
    def _action(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in {"BUY", "SELL"}:
            raise ValueError("action must be BUY or SELL")
        return v

    @field_validator("symbol", "strategy")
    @classmethod
    def _clean(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


class SignalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    received_at: datetime
    symbol: str
    strategy: str
    action: str
    price: float
    outcome: str
    pnl_pct: float | None
    notified: bool
    note: str | None


class PositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    strategy: str
    status: str
    entry_price: float | None
    entry_time: datetime | None
    last_price: float | None
    updated_at: datetime
