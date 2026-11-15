from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Profile

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ProfileResponse(BaseModel):
    name: str
    updated_at: datetime


@router.get("", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == 1).first()

    if not profile:
        profile = Profile(id=1, name="TradeAlert User")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


@router.put("", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be empty")

    profile = db.query(Profile).filter(Profile.id == 1).first()

    if not profile:
        profile = Profile(id=1, name=name)
        db.add(profile)
    else:
        profile.name = name

    db.commit()
    db.refresh(profile)

    return profile