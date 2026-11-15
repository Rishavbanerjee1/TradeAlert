from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class TVPayload(BaseModel):
    """JSON received from TradingView."""

    secret: str
    symbol: str
    action: str
    price: float
    strategy: str = "default"
    note: str | None = None

    @field_validator("action")
    @classmethod
    def validate_action(cls, value: str) -> str:
        value = value.strip().upper()

        if value not in {"BUY", "SELL"}:
            raise ValueError("action must be BUY or SELL")

        return value

    @field_validator("symbol", "strategy")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("must not be empty")

        return value


class ManualNotificationIn(BaseModel):
    type: Literal["custom", "signal"]

    message: str | None = Field(default=None, max_length=4000)

    action: Literal["BUY", "HOLD", "SELL"] | None = None
    symbol: str | None = Field(default=None, max_length=30)
    price: float | None = Field(default=None, gt=0)
    strategy: str | None = Field(
        default="Manual alert",
        max_length=100,
    )

    @model_validator(mode="after")
    def validate_notification(self):
        if self.type == "custom":
            if not self.message or not self.message.strip():
                raise ValueError("Message cannot be empty")

        if self.type == "signal":
            if not self.action:
                raise ValueError("Action is required")

            if not self.symbol or not self.symbol.strip():
                raise ValueError("Symbol is required")

            if self.price is None:
                raise ValueError("A valid price is required")

        return self

    @field_validator("symbol", "strategy")
    @classmethod
    def clean_optional_text(cls, value):
        if value is None:
            return value

        return value.strip()


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

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    type: str
    message: str
    action: str | None
    symbol: str | None
    price: float | None
    strategy: str | None
    status: str