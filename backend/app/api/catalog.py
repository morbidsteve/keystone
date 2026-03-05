"""Catalog API — read-only reference data for equipment, supply, and ammunition."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.database import get_db
from app.models.catalog_ammunition import AmmunitionCatalogItem
from app.models.catalog_equipment import EquipmentCatalogItem
from app.models.catalog_supply import SupplyCatalogItem
from app.models.user import Role, User
from app.schemas.catalog import (
    AmmunitionCatalogResponse,
    CategoryInfo,
    EquipmentCatalogResponse,
    SupplyCatalogResponse,
    SupplyClassInfo,
)

router = APIRouter()

# Roles permitted to access ammunition catalog data
AMMO_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


def _escape_like(value: str) -> str:
    """Escape SQL LIKE wildcard characters to prevent injection."""
    return value.replace("%", "\\%").replace("_", "\\_")


# ---------------------------------------------------------------------------
# Equipment catalog
# ---------------------------------------------------------------------------


@router.get("/equipment", response_model=list[EquipmentCatalogResponse])
async def search_equipment_catalog(
    q: Optional[str] = Query(None, description="Search TAMCN, nomenclature, or common name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search the equipment catalog by TAMCN, nomenclature, or common name."""
    query = select(EquipmentCatalogItem).where(
        EquipmentCatalogItem.is_active.is_(True)
    )

    filters = []
    if q:
        like_q = f"%{_escape_like(q)}%"
        filters.append(
            EquipmentCatalogItem.tamcn.ilike(like_q)
            | EquipmentCatalogItem.nomenclature.ilike(like_q)
            | EquipmentCatalogItem.common_name.ilike(like_q)
            | EquipmentCatalogItem.nsn.ilike(like_q)
        )
    if category:
        filters.append(EquipmentCatalogItem.category.ilike(f"%{_escape_like(category)}%"))
    if subcategory:
        filters.append(EquipmentCatalogItem.subcategory.ilike(f"%{_escape_like(subcategory)}%"))

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(EquipmentCatalogItem.category, EquipmentCatalogItem.nomenclature)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/equipment/categories", response_model=list[CategoryInfo])
async def equipment_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List distinct equipment categories with their subcategories."""
    result = await db.execute(
        select(
            EquipmentCatalogItem.category,
            func.array_agg(distinct(EquipmentCatalogItem.subcategory)).label(
                "subcategories"
            ),
        )
        .where(EquipmentCatalogItem.is_active.is_(True))
        .group_by(EquipmentCatalogItem.category)
        .order_by(EquipmentCatalogItem.category)
    )
    rows = result.all()
    return [
        CategoryInfo(
            category=row[0],
            subcategories=sorted(s for s in row[1] if s is not None),
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Supply catalog
# ---------------------------------------------------------------------------


@router.get("/supply", response_model=list[SupplyCatalogResponse])
async def search_supply_catalog(
    q: Optional[str] = Query(None, description="Search NSN, DODIC, LIN, or nomenclature"),
    supply_class: Optional[str] = Query(None, description="Filter by supply class"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search the supply catalog by NSN, DODIC, nomenclature, or supply class."""
    query = select(SupplyCatalogItem).where(SupplyCatalogItem.is_active.is_(True))

    filters = []
    if q:
        like_q = f"%{_escape_like(q)}%"
        filters.append(
            SupplyCatalogItem.nsn.ilike(like_q)
            | SupplyCatalogItem.dodic.ilike(like_q)
            | SupplyCatalogItem.lin.ilike(like_q)
            | SupplyCatalogItem.nomenclature.ilike(like_q)
            | SupplyCatalogItem.common_name.ilike(like_q)
        )
    if supply_class:
        filters.append(SupplyCatalogItem.supply_class == supply_class)
    if category:
        filters.append(SupplyCatalogItem.category.ilike(f"%{_escape_like(category)}%"))

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(SupplyCatalogItem.supply_class, SupplyCatalogItem.nomenclature)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/supply/classes", response_model=list[SupplyClassInfo])
async def supply_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List distinct supply classes with item counts."""
    result = await db.execute(
        select(
            SupplyCatalogItem.supply_class,
            func.count(SupplyCatalogItem.id).label("item_count"),
        )
        .where(SupplyCatalogItem.is_active.is_(True))
        .group_by(SupplyCatalogItem.supply_class)
        .order_by(SupplyCatalogItem.supply_class)
    )
    rows = result.all()
    return [
        SupplyClassInfo(supply_class=row[0], item_count=row[1]) for row in rows
    ]


# ---------------------------------------------------------------------------
# Ammunition catalog
# ---------------------------------------------------------------------------


@router.get("/ammunition", response_model=list[AmmunitionCatalogResponse])
async def search_ammunition_catalog(
    q: Optional[str] = Query(None, description="Search DODIC, caliber, or nomenclature"),
    caliber: Optional[str] = Query(None, description="Filter by caliber"),
    weapon_system: Optional[str] = Query(None, description="Filter by weapon system"),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(AMMO_ROLES)),
):
    """Search the ammunition catalog by DODIC, caliber, or nomenclature.

    Restricted to ADMIN, COMMANDER, S3, and S4 roles.
    """
    query = select(AmmunitionCatalogItem).where(
        AmmunitionCatalogItem.is_active.is_(True)
    )

    filters = []
    if q:
        like_q = f"%{_escape_like(q)}%"
        filters.append(
            AmmunitionCatalogItem.dodic.ilike(like_q)
            | AmmunitionCatalogItem.caliber.ilike(like_q)
            | AmmunitionCatalogItem.nomenclature.ilike(like_q)
            | AmmunitionCatalogItem.common_name.ilike(like_q)
        )
    if caliber:
        filters.append(AmmunitionCatalogItem.caliber.ilike(f"%{_escape_like(caliber)}%"))
    if weapon_system:
        filters.append(AmmunitionCatalogItem.weapon_system.ilike(f"%{_escape_like(weapon_system)}%"))

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(AmmunitionCatalogItem.dodic)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()
