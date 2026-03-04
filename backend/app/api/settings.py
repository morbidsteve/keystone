"""System settings endpoints: classification banner and tile layer configuration."""

import json
from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, Depends
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


# --- Tile layer configuration ---


class TileLayerConfig(BaseModel):
    name: str
    label: str
    url_template: str
    attribution: str = ""
    max_zoom: int = Field(default=19, ge=1, le=22)
    enabled: bool = True
    order: int = Field(default=0, ge=0)

    @classmethod
    def validate_url_template(cls, v: str) -> str:
        """Ensure url_template is a relative /tiles/ path, not an external URL."""
        if not v.startswith("/tiles/"):
            raise ValueError(
                "url_template must be a relative path starting with /tiles/"
            )
        # Block any attempt to use protocol-relative or absolute URLs
        if "://" in v or v.startswith("//"):
            raise ValueError("url_template must not contain external URLs")
        return v


class TileLayersResponse(BaseModel):
    layers: List[TileLayerConfig]


class TileLayersUpdate(BaseModel):
    layers: List[TileLayerConfig]


DEFAULT_TILE_LAYERS = [
    {
        "name": "osm",
        "label": "OpenStreetMap",
        "url_template": "/tiles/osm/{z}/{x}/{y}.png",
        "attribution": "OpenStreetMap",
        "max_zoom": 19,
        "enabled": True,
        "order": 0,
    },
    {
        "name": "satellite",
        "label": "Satellite",
        "url_template": "/tiles/satellite/{z}/{y}/{x}",
        "attribution": "Esri",
        "max_zoom": 18,
        "enabled": True,
        "order": 1,
    },
    {
        "name": "topo",
        "label": "Topographic",
        "url_template": "/tiles/topo/{z}/{x}/{y}.png",
        "attribution": "OpenTopoMap",
        "max_zoom": 17,
        "enabled": True,
        "order": 2,
    },
]


@router.get("/tile-layers", response_model=TileLayersResponse)
async def get_tile_layers(db: AsyncSession = Depends(get_db)):
    """Return tile layer configuration. No auth required — every map view needs it."""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "tile_layers")
    )
    setting = result.scalars().first()

    if setting is None:
        return TileLayersResponse(
            layers=[TileLayerConfig(**layer) for layer in DEFAULT_TILE_LAYERS]
        )

    try:
        data = json.loads(setting.value)
        layers = [TileLayerConfig(**layer) for layer in data.get("layers", [])]
        return TileLayersResponse(layers=layers)
    except (json.JSONDecodeError, TypeError, ValueError):
        return TileLayersResponse(
            layers=[TileLayerConfig(**layer) for layer in DEFAULT_TILE_LAYERS]
        )


@router.put("/tile-layers", response_model=TileLayersResponse)
async def update_tile_layers(
    payload: TileLayersUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update tile layer configuration (admin only)."""
    # Validate all url_templates are safe relative paths
    for layer in payload.layers:
        TileLayerConfig.validate_url_template(layer.url_template)

    layers_data = {"layers": [layer.model_dump() for layer in payload.layers]}
    json_value = json.dumps(layers_data)

    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "tile_layers")
    )
    setting = result.scalars().first()

    if setting is None:
        setting = SystemSetting(
            key="tile_layers",
            value=json_value,
            updated_by=current_user.username,
        )
        db.add(setting)
    else:
        setting.value = json_value
        setting.updated_by = current_user.username

    await db.flush()
    await db.refresh(setting)

    return TileLayersResponse(layers=payload.layers)
