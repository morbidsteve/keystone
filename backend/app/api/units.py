"""Unit hierarchy management endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.models.unit import Unit
from app.models.user import Role, User
from app.schemas.unit import UnitCreate, UnitResponse

router = APIRouter()


@router.get("/", response_model=List[UnitResponse])
async def list_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all units as a tree structure (returns top-level units with children)."""
    result = await db.execute(
        select(Unit)
        .where(Unit.parent_id == None)
        .options(selectinload(Unit.children).selectinload(Unit.children).selectinload(Unit.children).selectinload(Unit.children))
    )
    units = result.scalars().all()
    return units


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single unit with its children."""
    result = await db.execute(
        select(Unit)
        .where(Unit.id == unit_id)
        .options(selectinload(Unit.children))
    )
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)
    return unit


@router.post("/", response_model=UnitResponse, status_code=201)
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new unit (admin only)."""
    unit = Unit(**data.model_dump())
    db.add(unit)
    await db.flush()
    await db.refresh(unit)
    return unit


@router.get("/{unit_id}/hierarchy")
async def get_unit_hierarchy(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full unit hierarchy below this unit."""
    result = await db.execute(
        select(Unit).where(Unit.id == unit_id)
    )
    root = result.scalar_one_or_none()
    if not root:
        raise NotFoundError("Unit", unit_id)

    async def build_tree(unit_id: int) -> dict:
        result = await db.execute(
            select(Unit).where(Unit.id == unit_id)
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return {}

        children_result = await db.execute(
            select(Unit).where(Unit.parent_id == unit_id)
        )
        children = children_result.scalars().all()

        child_trees = []
        for child in children:
            child_trees.append(await build_tree(child.id))

        return {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "echelon": unit.echelon.value,
            "uic": unit.uic,
            "children": child_trees,
        }

    tree = await build_tree(unit_id)
    return tree
