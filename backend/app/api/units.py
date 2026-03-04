"""Unit hierarchy management endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.models.unit import Unit
from app.models.user import Role, User
from app.schemas.unit import UnitCreate, UnitResponse, UnitUpdate

router = APIRouter()


@router.get("/", response_model=List[UnitResponse])
async def list_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all units as a tree structure (returns top-level units with children)."""
    result = await db.execute(
        select(Unit)
        .where(Unit.parent_id == None)  # noqa: E711
        .options(
            selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
            .selectinload(Unit.children)
        )
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
        select(Unit).where(Unit.id == unit_id).options(selectinload(Unit.children))
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


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int,
    data: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update an existing unit (admin only). Detects and rejects parent cycles."""
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    # Cycle detection: walk ancestors of the proposed new parent to ensure
    # unit_id is not among them (which would create a cycle).
    if data.parent_id is not None and data.parent_id != unit.parent_id:
        visited: set[int] = set()
        current_id: int | None = data.parent_id
        while current_id is not None:
            if current_id == unit_id:
                raise HTTPException(
                    status_code=400,
                    detail="Setting this parent would create a cycle in the unit hierarchy.",
                )
            if current_id in visited:
                break
            visited.add(current_id)
            ancestor_result = await db.execute(
                select(Unit.parent_id).where(Unit.id == current_id)
            )
            row = ancestor_result.one_or_none()
            current_id = row[0] if row else None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(unit, field, value)

    await db.flush()
    await db.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Delete a unit (admin only). Refuses if the unit has children or assigned users."""
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    children_result = await db.execute(
        select(Unit.id).where(Unit.parent_id == unit_id).limit(1)
    )
    if children_result.one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete unit: it still has child units.",
        )

    from app.models.user import User as UserModel

    users_result = await db.execute(
        select(UserModel.id).where(UserModel.unit_id == unit_id).limit(1)
    )
    if users_result.one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete unit: it still has assigned users.",
        )

    await db.delete(unit)


@router.get("/{unit_id}/hierarchy")
async def get_unit_hierarchy(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full unit hierarchy below this unit."""
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    root = result.scalar_one_or_none()
    if not root:
        raise NotFoundError("Unit", unit_id)

    async def build_tree(unit_id: int) -> dict:
        result = await db.execute(select(Unit).where(Unit.id == unit_id))
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
