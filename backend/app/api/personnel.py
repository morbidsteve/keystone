"""Personnel directory CRUD endpoints."""

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.personnel import AmmoLoad, Personnel, PersonnelStatus, Weapon
from app.models.user import Role, User
from app.schemas.personnel import (
    AmmoLoadCreate,
    AmmoLoadResponse,
    AmmoLoadUpdate,
    PersonnelCreate,
    PersonnelResponse,
    PersonnelSummaryResponse,
    PersonnelUpdate,
    WeaponCreate,
    WeaponResponse,
    WeaponUpdate,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


@router.get("/", response_model=List[PersonnelSummaryResponse])
async def list_personnel(
    unit_id: Optional[int] = Query(None),
    status: Optional[PersonnelStatus] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List personnel filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Personnel).where(Personnel.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(Personnel.unit_id == unit_id)
    if status:
        query = query.where(Personnel.status == status)
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Personnel.edipi.ilike(term),
                Personnel.first_name.ilike(term),
                Personnel.last_name.ilike(term),
            )
        )

    query = query.order_by(Personnel.last_name, Personnel.first_name).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/search", response_model=List[PersonnelSummaryResponse])
async def search_personnel(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Typeahead search by EDIPI or name."""
    accessible = await get_accessible_units(db, current_user)
    term = f"%{q}%"
    query = (
        select(Personnel)
        .where(Personnel.unit_id.in_(accessible))
        .where(
            or_(
                Personnel.edipi.ilike(term),
                Personnel.first_name.ilike(term),
                Personnel.last_name.ilike(term),
            )
        )
        .order_by(Personnel.last_name)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{person_id}", response_model=PersonnelResponse)
async def get_personnel(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personnel detail with weapons and ammo."""
    query = (
        select(Personnel)
        .where(Personnel.id == person_id)
        .options(selectinload(Personnel.weapons), selectinload(Personnel.ammo_loads))
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    return person


@router.post(
    "/",
    response_model=PersonnelResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_personnel(
    data: PersonnelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new personnel record with optional nested weapons/ammo."""
    # Check EDIPI uniqueness
    existing = await db.execute(
        select(Personnel).where(Personnel.edipi == data.edipi)
    )
    if existing.scalar_one_or_none():
        raise ConflictError("A personnel record with this EDIPI already exists")

    person_data = data.model_dump(exclude={"weapons", "ammo_loads"})
    person = Personnel(**person_data)
    db.add(person)
    await db.flush()

    # Add nested weapons
    if data.weapons:
        for w in data.weapons:
            weapon = Weapon(
                personnel_id=person.id,
                weapon_type=w.weapon_type,
                serial_number=w.serial_number,
                optic=w.optic,
                accessories=json.dumps(w.accessories) if w.accessories else None,
            )
            db.add(weapon)

    # Add nested ammo loads
    if data.ammo_loads:
        for a in data.ammo_loads:
            ammo = AmmoLoad(
                personnel_id=person.id,
                caliber=a.caliber,
                magazine_count=a.magazine_count,
                rounds_per_magazine=a.rounds_per_magazine,
                total_rounds=a.magazine_count * a.rounds_per_magazine,
            )
            db.add(ammo)

    await db.flush()

    # Reload with relationships
    query = (
        select(Personnel)
        .where(Personnel.id == person.id)
        .options(selectinload(Personnel.weapons), selectinload(Personnel.ammo_loads))
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.put(
    "/{person_id}",
    response_model=PersonnelResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_personnel(
    person_id: int,
    data: PersonnelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a personnel record."""
    query = (
        select(Personnel)
        .where(Personnel.id == person_id)
        .options(selectinload(Personnel.weapons), selectinload(Personnel.ammo_loads))
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)

    await db.flush()

    # Reload with relationships for response
    reload_query = (
        select(Personnel)
        .where(Personnel.id == person_id)
        .options(selectinload(Personnel.weapons), selectinload(Personnel.ammo_loads))
    )
    reload_result = await db.execute(reload_query)
    return reload_result.scalar_one()


@router.delete(
    "/{person_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_personnel(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete personnel by setting status to INACTIVE."""
    result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    person.status = PersonnelStatus.INACTIVE
    await db.flush()


# --- Weapon sub-routes ---

@router.post(
    "/{person_id}/weapons",
    response_model=WeaponResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_weapon(
    person_id: int,
    data: WeaponCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a weapon to a personnel record."""
    result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    weapon = Weapon(
        personnel_id=person_id,
        weapon_type=data.weapon_type,
        serial_number=data.serial_number,
        optic=data.optic,
        accessories=json.dumps(data.accessories) if data.accessories else None,
    )
    db.add(weapon)
    await db.flush()
    await db.refresh(weapon)
    return weapon


@router.put(
    "/{person_id}/weapons/{weapon_id}",
    response_model=WeaponResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_weapon(
    person_id: int,
    weapon_id: int,
    data: WeaponUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a weapon."""
    # Verify personnel exists and is accessible
    person_result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    result = await db.execute(
        select(Weapon).where(Weapon.id == weapon_id, Weapon.personnel_id == person_id)
    )
    weapon = result.scalar_one_or_none()
    if not weapon:
        raise NotFoundError("Weapon", weapon_id)

    update_data = data.model_dump(exclude_unset=True)
    if "accessories" in update_data and update_data["accessories"] is not None:
        update_data["accessories"] = json.dumps(update_data["accessories"])
    for field, value in update_data.items():
        setattr(weapon, field, value)

    await db.flush()
    await db.refresh(weapon)
    return weapon


@router.delete(
    "/{person_id}/weapons/{weapon_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_weapon(
    person_id: int,
    weapon_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a weapon."""
    # Verify personnel exists and is accessible
    person_result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    result = await db.execute(
        select(Weapon).where(Weapon.id == weapon_id, Weapon.personnel_id == person_id)
    )
    weapon = result.scalar_one_or_none()
    if not weapon:
        raise NotFoundError("Weapon", weapon_id)

    await db.delete(weapon)
    await db.flush()


# --- AmmoLoad sub-routes ---

@router.post(
    "/{person_id}/ammo-loads",
    response_model=AmmoLoadResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_ammo_load(
    person_id: int,
    data: AmmoLoadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add an ammo load to a personnel record."""
    result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    ammo = AmmoLoad(
        personnel_id=person_id,
        caliber=data.caliber,
        magazine_count=data.magazine_count,
        rounds_per_magazine=data.rounds_per_magazine,
        total_rounds=data.magazine_count * data.rounds_per_magazine,
    )
    db.add(ammo)
    await db.flush()
    await db.refresh(ammo)
    return ammo


@router.put(
    "/{person_id}/ammo-loads/{ammo_id}",
    response_model=AmmoLoadResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_ammo_load(
    person_id: int,
    ammo_id: int,
    data: AmmoLoadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an ammo load."""
    # Verify personnel exists and is accessible
    person_result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    result = await db.execute(
        select(AmmoLoad).where(AmmoLoad.id == ammo_id, AmmoLoad.personnel_id == person_id)
    )
    ammo = result.scalar_one_or_none()
    if not ammo:
        raise NotFoundError("AmmoLoad", ammo_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ammo, field, value)

    # Recompute total_rounds
    ammo.total_rounds = ammo.magazine_count * ammo.rounds_per_magazine

    await db.flush()
    await db.refresh(ammo)
    return ammo


@router.delete(
    "/{person_id}/ammo-loads/{ammo_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_ammo_load(
    person_id: int,
    ammo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an ammo load."""
    # Verify personnel exists and is accessible
    person_result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    result = await db.execute(
        select(AmmoLoad).where(AmmoLoad.id == ammo_id, AmmoLoad.personnel_id == person_id)
    )
    ammo = result.scalar_one_or_none()
    if not ammo:
        raise NotFoundError("AmmoLoad", ammo_id)

    await db.delete(ammo)
    await db.flush()
