from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Profile

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ProfileResponse(BaseModel):
    name: str
    updated_at: datetime


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


@router.get("", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    try:
        return get_or_create_profile(db)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve profile",
        )


@router.put("", response_model=ProfileResponse)
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
        raise HTTPException(
            status_code=500,
            detail="Unable to update profile",
        )