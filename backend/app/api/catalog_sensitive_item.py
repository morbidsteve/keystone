"""Sensitive Item Catalog API — CRUD for the dynamic sensitive item reference catalog."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Text, and_, cast, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.models.catalog_sensitive_item import SensitiveItemCatalogEntry
from app.models.custody import SensitiveItemType
from app.models.user import Role, User
from app.schemas.catalog_sensitive_item import (
    CatalogItemCreate,
    CatalogItemResponse,
    CatalogItemUpdate,
)

router = APIRouter()

ADMIN_ROLES = [Role.ADMIN]


def _escape_like(value: str) -> str:
    """Escape SQL LIKE wildcard characters to prevent injection."""
    return value.replace("%", "\\%").replace("_", "\\_")


# ---------------------------------------------------------------------------
# List / Search
# ---------------------------------------------------------------------------


@router.get("/sensitive-items", response_model=list[CatalogItemResponse])
async def list_sensitive_item_catalog(
    q: Optional[str] = Query(
        None, description="Search nomenclature, NSN, or aliases (case-insensitive)"
    ),
    item_type: Optional[SensitiveItemType] = Query(
        None, description="Filter by item type"
    ),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sensitive item catalog entries with optional search and filters.

    Available to all authenticated users. The ``q`` parameter searches across
    nomenclature, NSN, TAMCN, and aliases (case-insensitive substring match).
    """
    query = select(SensitiveItemCatalogEntry)

    filters = []

    # Default to active items only unless explicitly overridden
    if is_active is not None:
        filters.append(SensitiveItemCatalogEntry.is_active.is_(is_active))
    else:
        filters.append(SensitiveItemCatalogEntry.is_active.is_(True))

    if item_type is not None:
        filters.append(SensitiveItemCatalogEntry.item_type == item_type)

    if q:
        like_q = f"%{_escape_like(q)}%"
        # Cast JSON aliases column to Text for cross-DB LIKE search
        filters.append(
            or_(
                SensitiveItemCatalogEntry.nomenclature.ilike(like_q),
                SensitiveItemCatalogEntry.nsn.ilike(like_q),
                SensitiveItemCatalogEntry.tamcn.ilike(like_q),
                cast(SensitiveItemCatalogEntry.aliases, Text).ilike(like_q),
            )
        )

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(
        SensitiveItemCatalogEntry.item_type,
        SensitiveItemCatalogEntry.nomenclature,
    )
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Get by ID
# ---------------------------------------------------------------------------


@router.get("/sensitive-items/{item_id}", response_model=CatalogItemResponse)
async def get_sensitive_item_catalog_entry(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single sensitive item catalog entry by ID."""
    result = await db.execute(
        select(SensitiveItemCatalogEntry).where(SensitiveItemCatalogEntry.id == item_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("CatalogItem", item_id)
    return entry


# ---------------------------------------------------------------------------
# Create (ADMIN only)
# ---------------------------------------------------------------------------


@router.post(
    "/sensitive-items",
    response_model=CatalogItemResponse,
    status_code=201,
    dependencies=[Depends(require_role(ADMIN_ROLES))],
)
async def create_sensitive_item_catalog_entry(
    data: CatalogItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sensitive item catalog entry. ADMIN only."""
    entry = SensitiveItemCatalogEntry(**data.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Update (ADMIN only)
# ---------------------------------------------------------------------------


@router.put(
    "/sensitive-items/{item_id}",
    response_model=CatalogItemResponse,
    dependencies=[Depends(require_role(ADMIN_ROLES))],
)
async def update_sensitive_item_catalog_entry(
    item_id: int,
    data: CatalogItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a sensitive item catalog entry. ADMIN only."""
    result = await db.execute(
        select(SensitiveItemCatalogEntry).where(SensitiveItemCatalogEntry.id == item_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("CatalogItem", item_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.flush()
    await db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Delete — soft delete (ADMIN only)
# ---------------------------------------------------------------------------


@router.delete(
    "/sensitive-items/{item_id}",
    response_model=CatalogItemResponse,
    dependencies=[Depends(require_role(ADMIN_ROLES))],
)
async def delete_sensitive_item_catalog_entry(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a sensitive item catalog entry (set is_active=False). ADMIN only."""
    result = await db.execute(
        select(SensitiveItemCatalogEntry).where(SensitiveItemCatalogEntry.id == item_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("CatalogItem", item_id)

    entry.is_active = False
    await db.flush()
    await db.refresh(entry)
    return entry
