"""Convoy manifest endpoints — vehicle & personnel assignment per movement."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import check_unit_access, require_role
from app.database import get_db
from app.models.personnel import ConvoyPersonnel, ConvoyVehicle, Personnel
from app.models.transportation import Movement
from app.models.user import Role, User
from app.schemas.personnel import (
    BulkManifestCreate,
    ConvoyManifestResponse,
    ConvoyPersonnelCreate,
    ConvoyPersonnelResponse,
    ConvoyPersonnelUpdate,
    ConvoyVehicleCreate,
    ConvoyVehicleResponse,
    ConvoyVehicleUpdate,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


async def _get_movement(movement_id: int, db: AsyncSession, user: User) -> Movement:
    """Fetch movement and verify unit access."""
    result = await db.execute(select(Movement).where(Movement.id == movement_id))
    movement = result.scalar_one_or_none()
    if not movement:
        raise NotFoundError("Movement", movement_id)
    await check_unit_access(user, movement.unit_id, db)
    return movement


@router.get("/{movement_id}/manifest", response_model=ConvoyManifestResponse)
async def get_manifest(
    movement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full convoy manifest for a movement."""
    await _get_movement(movement_id, db, current_user)

    # Vehicles with assigned personnel (eager-loaded)
    veh_query = (
        select(ConvoyVehicle)
        .where(ConvoyVehicle.movement_id == movement_id)
        .options(
            selectinload(ConvoyVehicle.assigned_personnel).selectinload(
                ConvoyPersonnel.personnel
            )
        )
        .order_by(ConvoyVehicle.sequence_number)
    )
    veh_result = await db.execute(veh_query)
    vehicles = veh_result.scalars().all()

    # Unassigned personnel (no vehicle)
    unassigned_query = (
        select(ConvoyPersonnel)
        .where(
            ConvoyPersonnel.movement_id == movement_id,
            ConvoyPersonnel.convoy_vehicle_id.is_(None),
        )
        .options(selectinload(ConvoyPersonnel.personnel))
    )
    unassigned_result = await db.execute(unassigned_query)
    unassigned = unassigned_result.scalars().all()

    # Count all personnel
    all_personnel_query = select(ConvoyPersonnel).where(
        ConvoyPersonnel.movement_id == movement_id
    )
    all_personnel_result = await db.execute(all_personnel_query)
    total_personnel = len(all_personnel_result.scalars().all())

    return ConvoyManifestResponse(
        movement_id=movement_id,
        vehicles=vehicles,
        unassigned_personnel=unassigned,
        total_vehicles=len(vehicles),
        total_personnel=total_personnel,
    )


@router.post(
    "/{movement_id}/manifest",
    response_model=ConvoyManifestResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def bulk_create_manifest(
    movement_id: int,
    data: BulkManifestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk create/replace entire convoy manifest."""
    await _get_movement(movement_id, db, current_user)

    # Validate all referenced personnel exist
    all_personnel_ids = set()
    for veh_entry in data.vehicles:
        for p in veh_entry.personnel:
            all_personnel_ids.add(p.personnel_id)
    for p in data.unassigned_personnel:
        all_personnel_ids.add(p.personnel_id)

    for pid in all_personnel_ids:
        person_result = await db.execute(
            select(Personnel).where(Personnel.id == pid)
        )
        if not person_result.scalar_one_or_none():
            raise NotFoundError("Personnel", pid)

    # Delete existing manifest data
    await db.execute(
        delete(ConvoyPersonnel).where(ConvoyPersonnel.movement_id == movement_id)
    )
    await db.execute(
        delete(ConvoyVehicle).where(ConvoyVehicle.movement_id == movement_id)
    )
    await db.flush()

    # Create vehicles and their personnel
    for veh_entry in data.vehicles:
        vehicle = ConvoyVehicle(
            movement_id=movement_id,
            vehicle_type=veh_entry.vehicle_type,
            tamcn=veh_entry.tamcn,
            bumper_number=veh_entry.bumper_number,
            call_sign=veh_entry.call_sign,
            sequence_number=veh_entry.sequence_number,
        )
        db.add(vehicle)
        await db.flush()

        for p in veh_entry.personnel:
            assignment = ConvoyPersonnel(
                movement_id=movement_id,
                personnel_id=p.personnel_id,
                convoy_vehicle_id=vehicle.id,
                role=p.role,
            )
            db.add(assignment)

    # Create unassigned personnel
    for p in data.unassigned_personnel:
        assignment = ConvoyPersonnel(
            movement_id=movement_id,
            personnel_id=p.personnel_id,
            convoy_vehicle_id=None,
            role=p.role,
        )
        db.add(assignment)

    await db.flush()

    # Return full manifest
    return await get_manifest(movement_id, db, current_user)


@router.post(
    "/{movement_id}/vehicles",
    response_model=ConvoyVehicleResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_vehicle(
    movement_id: int,
    data: ConvoyVehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a single vehicle to a convoy."""
    await _get_movement(movement_id, db, current_user)

    vehicle = ConvoyVehicle(movement_id=movement_id, **data.model_dump())
    db.add(vehicle)
    await db.flush()

    # Reload with empty personnel list
    query = (
        select(ConvoyVehicle)
        .where(ConvoyVehicle.id == vehicle.id)
        .options(
            selectinload(ConvoyVehicle.assigned_personnel).selectinload(
                ConvoyPersonnel.personnel
            )
        )
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.put(
    "/{movement_id}/vehicles/{vehicle_id}",
    response_model=ConvoyVehicleResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_vehicle(
    movement_id: int,
    vehicle_id: int,
    data: ConvoyVehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a convoy vehicle."""
    await _get_movement(movement_id, db, current_user)

    result = await db.execute(
        select(ConvoyVehicle).where(
            ConvoyVehicle.id == vehicle_id,
            ConvoyVehicle.movement_id == movement_id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFoundError("ConvoyVehicle", vehicle_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)

    await db.flush()

    # Reload with personnel
    query = (
        select(ConvoyVehicle)
        .where(ConvoyVehicle.id == vehicle.id)
        .options(
            selectinload(ConvoyVehicle.assigned_personnel).selectinload(
                ConvoyPersonnel.personnel
            )
        )
    )
    reload_result = await db.execute(query)
    return reload_result.scalar_one()


@router.delete(
    "/{movement_id}/vehicles/{vehicle_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_vehicle(
    movement_id: int,
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a convoy vehicle. Assigned personnel become unassigned (SET NULL)."""
    await _get_movement(movement_id, db, current_user)

    result = await db.execute(
        select(ConvoyVehicle).where(
            ConvoyVehicle.id == vehicle_id,
            ConvoyVehicle.movement_id == movement_id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFoundError("ConvoyVehicle", vehicle_id)

    await db.delete(vehicle)
    await db.flush()


@router.post(
    "/{movement_id}/personnel",
    response_model=ConvoyPersonnelResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def assign_personnel(
    movement_id: int,
    data: ConvoyPersonnelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a person to a movement (optionally to a vehicle)."""
    await _get_movement(movement_id, db, current_user)

    # Verify personnel exists and is accessible
    person_result = await db.execute(
        select(Personnel).where(Personnel.id == data.personnel_id)
    )
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", data.personnel_id)

    assignment = ConvoyPersonnel(
        movement_id=movement_id,
        personnel_id=data.personnel_id,
        convoy_vehicle_id=data.convoy_vehicle_id,
        role=data.role,
    )
    db.add(assignment)
    await db.flush()

    # Reload with personnel details
    query = (
        select(ConvoyPersonnel)
        .where(ConvoyPersonnel.id == assignment.id)
        .options(selectinload(ConvoyPersonnel.personnel))
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.put(
    "/{movement_id}/personnel/{assignment_id}",
    response_model=ConvoyPersonnelResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_assignment(
    movement_id: int,
    assignment_id: int,
    data: ConvoyPersonnelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a personnel assignment."""
    await _get_movement(movement_id, db, current_user)

    result = await db.execute(
        select(ConvoyPersonnel).where(
            ConvoyPersonnel.id == assignment_id,
            ConvoyPersonnel.movement_id == movement_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise NotFoundError("ConvoyPersonnel", assignment_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)

    await db.flush()

    query = (
        select(ConvoyPersonnel)
        .where(ConvoyPersonnel.id == assignment.id)
        .options(selectinload(ConvoyPersonnel.personnel))
    )
    reload_result = await db.execute(query)
    return reload_result.scalar_one()


@router.delete(
    "/{movement_id}/personnel/{assignment_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def unassign_personnel(
    movement_id: int,
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a personnel assignment from a movement."""
    await _get_movement(movement_id, db, current_user)

    result = await db.execute(
        select(ConvoyPersonnel).where(
            ConvoyPersonnel.id == assignment_id,
            ConvoyPersonnel.movement_id == movement_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise NotFoundError("ConvoyPersonnel", assignment_id)

    await db.delete(assignment)
    await db.flush()
