"""Medical logistics, CASEVAC 9-line, MTF, blood product, and burn rate endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.medical import (
    BloodProduct,
    CasualtyReport,
    CasualtyReportStatus,
    EvacuationStatus,
    MedicalSupplyBurnRate,
    MedicalTreatmentFacility,
)
from app.models.user import Role, User
from app.schemas.medical import (
    ArrivalRequest,
    BloodProductCreate,
    BloodProductResponse,
    BloodProductUpdate,
    BurnRateCreate,
    BurnRateResponse,
    CasualtyReportCreate,
    CasualtyReportResponse,
    CasualtyReportUpdate,
    CloseRequest,
    DispatchRequest,
    MTFCreate,
    MTFResponse,
    MTFUpdate,
)
from app.services.casevac import CasevacService

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


# ---------------------------------------------------------------------------
# Casualty Reports (9-Line CASEVAC)
# ---------------------------------------------------------------------------


@router.post(
    "/casualties",
    response_model=CasualtyReportResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_casualty_report(
    data: CasualtyReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a 9-line CASEVAC report."""
    await check_unit_access(current_user, data.unit_id, db)
    report = await CasevacService.create_casualty_report(
        db=db,
        user=current_user,
        data=data.model_dump(),
    )
    return report


@router.get("/casualties", response_model=List[CasualtyReportResponse])
async def list_casualties(
    unit_id: Optional[int] = Query(None),
    status: Optional[CasualtyReportStatus] = Query(None),
    evacuation_status: Optional[EvacuationStatus] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List casualty reports filtered by accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = select(CasualtyReport).where(CasualtyReport.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(CasualtyReport.unit_id == unit_id)
    if status:
        query = query.where(CasualtyReport.status == status)
    if evacuation_status:
        query = query.where(CasualtyReport.evacuation_status == evacuation_status)

    query = (
        query.options(selectinload(CasualtyReport.logs))
        .order_by(CasualtyReport.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/casualties/{casualty_id}", response_model=CasualtyReportResponse)
async def get_casualty(
    casualty_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single casualty report by its casualty_id string."""
    result = await db.execute(
        select(CasualtyReport)
        .where(CasualtyReport.casualty_id == casualty_id)
        .options(selectinload(CasualtyReport.logs))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("CasualtyReport", casualty_id)

    accessible = await get_accessible_units(db, current_user)
    if report.unit_id not in accessible:
        raise NotFoundError("CasualtyReport", casualty_id)

    return report


@router.put(
    "/casualties/{casualty_id}",
    response_model=CasualtyReportResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_casualty(
    casualty_id: str,
    data: CasualtyReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a casualty report."""
    result = await db.execute(
        select(CasualtyReport)
        .where(CasualtyReport.casualty_id == casualty_id)
        .options(selectinload(CasualtyReport.logs))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("CasualtyReport", casualty_id)

    await check_unit_access(current_user, report.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)

    await db.flush()
    await db.refresh(report)

    reload = await db.execute(
        select(CasualtyReport)
        .where(CasualtyReport.id == report.id)
        .options(selectinload(CasualtyReport.logs))
    )
    return reload.scalar_one()


@router.put(
    "/casualties/{casualty_id}/dispatch",
    response_model=CasualtyReportResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def dispatch_casualty(
    casualty_id: str,
    data: DispatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dispatch evacuation for a casualty report."""
    result = await db.execute(
        select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("CasualtyReport", casualty_id)

    await check_unit_access(current_user, report.unit_id, db)

    # H-5 fix: pass accessible units to verify facility access
    accessible = await get_accessible_units(db, current_user)
    return await CasevacService.dispatch_evacuation(
        db=db,
        user=current_user,
        casualty_id=report.id,
        facility_id=data.facility_id,
        transport_method=data.transport_method.value,
        accessible_unit_ids=accessible,
    )


@router.put(
    "/casualties/{casualty_id}/arrive",
    response_model=CasualtyReportResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def mark_arrived(
    casualty_id: str,
    data: ArrivalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a casualty as arrived at the medical treatment facility."""
    result = await db.execute(
        select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("CasualtyReport", casualty_id)

    await check_unit_access(current_user, report.unit_id, db)

    return await CasevacService.update_patient_status(
        db=db,
        user=current_user,
        casualty_id=report.id,
        new_status=EvacuationStatus.AT_FACILITY,
        notes=data.notes,
    )


@router.put(
    "/casualties/{casualty_id}/close",
    response_model=CasualtyReportResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def close_casualty(
    casualty_id: str,
    data: CloseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Close a casualty report with a disposition."""
    result = await db.execute(
        select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("CasualtyReport", casualty_id)

    await check_unit_access(current_user, report.unit_id, db)

    return await CasevacService.close_casualty_report(
        db=db,
        user=current_user,
        casualty_id=report.id,
        disposition=data.disposition,
    )


# ---------------------------------------------------------------------------
# Medical Treatment Facilities
# ---------------------------------------------------------------------------


@router.get("/facilities", response_model=List[MTFResponse])
async def list_facilities(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List medical treatment facilities filtered by accessible units."""
    # H-2 fix: filter by accessible units (or shared/unaffiliated facilities)
    from sqlalchemy import or_

    accessible = await get_accessible_units(db, current_user)
    query = (
        select(MedicalTreatmentFacility)
        .where(
            or_(
                MedicalTreatmentFacility.unit_id.in_(accessible),
                MedicalTreatmentFacility.unit_id.is_(None),
            )
        )
        .order_by(MedicalTreatmentFacility.name)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/facilities/nearest")
async def nearest_facility(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find nearest operational/degraded MTFs by lat/lon (Haversine)."""
    # H-3 fix: pass accessible units to filter results
    accessible = await get_accessible_units(db, current_user)
    return await CasevacService.find_nearest_mtf(
        db=db, lat=lat, lon=lon, accessible_unit_ids=accessible
    )


@router.get("/facilities/{facility_id}", response_model=MTFResponse)
async def get_facility(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single medical treatment facility."""
    result = await db.execute(
        select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.id == facility_id
        )
    )
    facility = result.scalar_one_or_none()
    if not facility:
        raise NotFoundError("MedicalTreatmentFacility", facility_id)

    # H-2 fix: verify unit access if facility is affiliated
    if facility.unit_id is not None:
        accessible = await get_accessible_units(db, current_user)
        if facility.unit_id not in accessible:
            raise NotFoundError("MedicalTreatmentFacility", facility_id)

    return facility


@router.post(
    "/facilities",
    response_model=MTFResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_facility(
    data: MTFCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a medical treatment facility."""
    if data.unit_id is not None:
        await check_unit_access(current_user, data.unit_id, db)

    facility = MedicalTreatmentFacility(**data.model_dump())
    db.add(facility)
    await db.flush()
    await db.refresh(facility)
    return facility


@router.put(
    "/facilities/{facility_id}",
    response_model=MTFResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_facility(
    facility_id: int,
    data: MTFUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a medical treatment facility."""
    result = await db.execute(
        select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.id == facility_id
        )
    )
    facility = result.scalar_one_or_none()
    if not facility:
        raise NotFoundError("MedicalTreatmentFacility", facility_id)

    # Check access to current unit if assigned
    if facility.unit_id is not None:
        await check_unit_access(current_user, facility.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # If changing unit_id, verify access to new unit
    if "unit_id" in update_data and update_data["unit_id"] is not None:
        await check_unit_access(current_user, update_data["unit_id"], db)

    for field, value in update_data.items():
        setattr(facility, field, value)

    await db.flush()
    await db.refresh(facility)
    return facility


# ---------------------------------------------------------------------------
# Blood Products
# ---------------------------------------------------------------------------


@router.get("/blood-products/{facility_id}", response_model=List[BloodProductResponse])
async def list_blood_products(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List blood product inventory at a facility."""
    fac_result = await db.execute(
        select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.id == facility_id
        )
    )
    facility = fac_result.scalar_one_or_none()
    if not facility:
        raise NotFoundError("MedicalTreatmentFacility", facility_id)

    # H-4 fix: if facility has no unit, require ADMIN; otherwise check unit access
    if facility.unit_id is not None:
        await check_unit_access(current_user, facility.unit_id, db)
    elif current_user.role != Role.ADMIN:
        accessible = await get_accessible_units(db, current_user)
        if not accessible:
            raise NotFoundError("MedicalTreatmentFacility", facility_id)

    result = await db.execute(
        select(BloodProduct).where(BloodProduct.facility_id == facility_id)
    )
    return result.scalars().all()


@router.post(
    "/blood-products",
    response_model=BloodProductResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_blood_product(
    data: BloodProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a blood product record to a facility."""
    fac_result = await db.execute(
        select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.id == data.facility_id
        )
    )
    facility = fac_result.scalar_one_or_none()
    if not facility:
        raise NotFoundError("MedicalTreatmentFacility", data.facility_id)

    # H-4 fix: require unit access or ADMIN for null-unit facilities
    if facility.unit_id is not None:
        await check_unit_access(current_user, facility.unit_id, db)
    elif current_user.role != Role.ADMIN:
        raise NotFoundError("MedicalTreatmentFacility", data.facility_id)

    product = BloodProduct(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.put(
    "/blood-products/{product_id}",
    response_model=BloodProductResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_blood_product(
    product_id: int,
    data: BloodProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a blood product record."""
    result = await db.execute(select(BloodProduct).where(BloodProduct.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("BloodProduct", product_id)

    fac_result = await db.execute(
        select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.id == product.facility_id
        )
    )
    facility = fac_result.scalar_one_or_none()
    # H-4 fix: require unit access or ADMIN for null-unit facilities
    if facility and facility.unit_id is not None:
        await check_unit_access(current_user, facility.unit_id, db)
    elif not facility or (facility.unit_id is None and current_user.role != Role.ADMIN):
        raise NotFoundError("BloodProduct", product_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


# ---------------------------------------------------------------------------
# Medical Supply Burn Rates
# ---------------------------------------------------------------------------


@router.get("/burn-rates/{unit_id}")
async def get_burn_rates(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get medical supply burn rates for a unit."""
    await check_unit_access(current_user, unit_id, db)
    return await CasevacService.calculate_medical_burn_rates(db=db, unit_id=unit_id)


@router.post(
    "/burn-rates",
    response_model=BurnRateResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_burn_rate(
    data: BurnRateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a medical supply burn rate record."""
    await check_unit_access(current_user, data.unit_id, db)

    record = MedicalSupplyBurnRate(**data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


# ---------------------------------------------------------------------------
# Medical PERSTAT
# ---------------------------------------------------------------------------


@router.get("/perstat-medical/{unit_id}")
async def get_perstat_medical(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get medical PERSTAT summary for a unit."""
    await check_unit_access(current_user, unit_id, db)
    return await CasevacService.generate_perstat_medical(db=db, unit_id=unit_id)
