"""System settings endpoints: classification banner configuration."""

import json
from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.database import get_db
from app.models.system_settings import SystemSetting
from app.models.user import Role, User

router = APIRouter()

# --- Classification level definitions ---

class ClassificationLevel(str, Enum):
    UNCLASSIFIED = "UNCLASSIFIED"
    CUI = "CUI"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP SECRET"
    TOP_SECRET_SCI = "TOP SECRET//SCI"


# Default colors per classification level
CLASSIFICATION_COLORS = {
    ClassificationLevel.UNCLASSIFIED: "green",
    ClassificationLevel.CUI: "amber",
    ClassificationLevel.CONFIDENTIAL: "red",
    ClassificationLevel.SECRET: "red",
    ClassificationLevel.TOP_SECRET: "yellow-on-red",
    ClassificationLevel.TOP_SECRET_SCI: "yellow-on-red",
}

DEFAULT_CLASSIFICATION = {
    "level": "UNCLASSIFIED",
    "banner_text": "UNCLASSIFIED",
    "color": "green",
}


class ClassificationResponse(BaseModel):
    level: str
    banner_text: str
    color: str


class ClassificationUpdate(BaseModel):
    level: ClassificationLevel
    banner_text: Optional[str] = Field(
        None,
        description="Custom banner text. Defaults to the level name if not provided.",
    )
    color: Optional[str] = Field(
        None,
        description="Custom banner color. Defaults to the standard color for the level.",
    )


@router.get("/classification", response_model=ClassificationResponse)
async def get_classification(db: AsyncSession = Depends(get_db)):
    """Return the current classification setting. No auth required — every page needs it."""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "classification")
    )
    setting = result.scalars().first()

    if setting is None:
        return ClassificationResponse(**DEFAULT_CLASSIFICATION)

    try:
        data = json.loads(setting.value)
        return ClassificationResponse(**data)
    except (json.JSONDecodeError, TypeError):
        return ClassificationResponse(**DEFAULT_CLASSIFICATION)


@router.put("/classification", response_model=ClassificationResponse)
async def update_classification(
    payload: ClassificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update the classification level (admin only)."""
    banner_text = payload.banner_text or payload.level.value
    color = payload.color or CLASSIFICATION_COLORS[payload.level]

    classification_data = {
        "level": payload.level.value,
        "banner_text": banner_text,
        "color": color,
    }
    json_value = json.dumps(classification_data)

    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "classification")
    )
    setting = result.scalars().first()

    if setting is None:
        setting = SystemSetting(
            key="classification",
            value=json_value,
            updated_by=current_user.username,
        )
        db.add(setting)
    else:
        setting.value = json_value
        setting.updated_by = current_user.username

    await db.flush()
    await db.refresh(setting)

    return ClassificationResponse(**classification_data)
