"""Tests for the equipment and equipment individual API endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import Equipment, EquipmentAssetStatus, EquipmentStatus
from app.models.unit import Unit
from app.models.user import User


@pytest_asyncio.fixture
async def test_equipment_status(db_session: AsyncSession, test_unit: Unit):
    """Create a test equipment status (aggregate) record."""
    record = EquipmentStatus(
        unit_id=test_unit.id,
        tamcn="D1195",
        nomenclature="HMMWV M1165A1",
        total_possessed=10,
        mission_capable=8,
        not_mission_capable_maintenance=1,
        not_mission_capable_supply=1,
        readiness_pct=80.0,
        source="test",
    )
    db_session.add(record)
    await db_session.flush()
    await db_session.refresh(record)
    return record


@pytest_asyncio.fixture
async def test_equipment_item(db_session: AsyncSession, test_unit: Unit):
    """Create a test individual equipment item."""
    item = Equipment(
        unit_id=test_unit.id,
        equipment_type="HMMWV",
        tamcn="D1195",
        nomenclature="HMMWV M1165A1",
        bumper_number="TST-001",
        serial_number="SN-12345",
        status=EquipmentAssetStatus.FMC,
        odometer_miles=15000,
    )
    db_session.add(item)
    await db_session.flush()
    await db_session.refresh(item)
    return item


# --- Aggregate Equipment Status endpoints ---


@pytest.mark.asyncio
async def test_list_equipment_status(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_status: EquipmentStatus,
):
    """GET /api/v1/equipment/ returns list of equipment status records."""
    resp = await client.get(
        "/api/v1/equipment/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(r["tamcn"] == "D1195" for r in data)


@pytest.mark.asyncio
async def test_get_equipment_status_by_id(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_status: EquipmentStatus,
):
    """GET /api/v1/equipment/{id} returns a single record."""
    resp = await client.get(
        f"/api/v1/equipment/{test_equipment_status.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_equipment_status.id
    assert data["tamcn"] == "D1195"


@pytest.mark.asyncio
async def test_get_equipment_status_not_found(
    client: AsyncClient, admin_token: str, admin_user: User
):
    """GET /api/v1/equipment/99999 returns 404."""
    resp = await client.get(
        "/api/v1/equipment/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_equipment_status(
    client: AsyncClient, admin_token: str, admin_user: User, test_unit: Unit
):
    """POST /api/v1/equipment/ creates a new equipment status record."""
    resp = await client.post(
        "/api/v1/equipment/",
        json={
            "unit_id": test_unit.id,
            "tamcn": "E1234",
            "nomenclature": "MTVR MK23",
            "total_possessed": 5,
            "mission_capable": 4,
            "not_mission_capable_maintenance": 1,
            "not_mission_capable_supply": 0,
            "readiness_pct": 80.0,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tamcn"] == "E1234"


@pytest.mark.asyncio
async def test_list_equipment_unauthenticated(client: AsyncClient):
    """GET /api/v1/equipment/ without auth returns 401/403."""
    resp = await client.get("/api/v1/equipment/")
    assert resp.status_code in (401, 403)


# --- Individual Equipment endpoints ---


@pytest.mark.asyncio
async def test_list_individual_equipment(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_item: Equipment,
):
    """GET /api/v1/equipment/individual/ returns list of individual items."""
    resp = await client.get(
        "/api/v1/equipment/individual/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(i["bumper_number"] == "TST-001" for i in data)


@pytest.mark.asyncio
async def test_get_individual_equipment_detail(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_item: Equipment,
):
    """GET /api/v1/equipment/individual/{id} returns item with faults and drivers."""
    resp = await client.get(
        f"/api/v1/equipment/individual/{test_equipment_item.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["bumper_number"] == "TST-001"
    assert "faults" in data
    assert "driver_assignments" in data


@pytest.mark.asyncio
async def test_get_individual_equipment_not_found(
    client: AsyncClient, admin_token: str, admin_user: User
):
    """GET /api/v1/equipment/individual/99999 returns 404."""
    resp = await client.get(
        "/api/v1/equipment/individual/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_individual_equipment(
    client: AsyncClient, admin_token: str, admin_user: User, test_unit: Unit
):
    """POST /api/v1/equipment/individual/ creates a new individual item."""
    resp = await client.post(
        "/api/v1/equipment/individual/",
        json={
            "unit_id": test_unit.id,
            "equipment_type": "MTVR",
            "tamcn": "B0022",
            "nomenclature": "MTVR MK25",
            "bumper_number": "NEW-001",
            "serial_number": "SN-NEW-001",
            "status": "FMC",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["bumper_number"] == "NEW-001"
    assert data["status"] == "FMC"


@pytest.mark.asyncio
async def test_create_duplicate_bumper_number(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_unit: Unit,
    test_equipment_item: Equipment,
):
    """POST with duplicate bumper_number returns 409."""
    resp = await client.post(
        "/api/v1/equipment/individual/",
        json={
            "unit_id": test_unit.id,
            "equipment_type": "HMMWV",
            "tamcn": "D1195",
            "nomenclature": "HMMWV M1165A1",
            "bumper_number": "TST-001",  # already exists
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_individual_equipment(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_item: Equipment,
):
    """PUT /api/v1/equipment/individual/{id} updates the item."""
    resp = await client.put(
        f"/api/v1/equipment/individual/{test_equipment_item.id}",
        json={"status": "NMC_M", "notes": "Deadlined for brake repair"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "NMC_M"
    assert data["notes"] == "Deadlined for brake repair"


@pytest.mark.asyncio
async def test_delete_individual_equipment(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_equipment_item: Equipment,
):
    """DELETE /api/v1/equipment/individual/{id} removes the item (admin only)."""
    resp = await client.delete(
        f"/api/v1/equipment/individual/{test_equipment_item.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204

    # Confirm it's gone
    resp2 = await client.get(
        f"/api/v1/equipment/individual/{test_equipment_item.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_operator_cannot_create_individual_equipment(
    client: AsyncClient,
    operator_token: str,
    operator_user: User,
    test_unit: Unit,
):
    """Operator role cannot create individual equipment (403)."""
    resp = await client.post(
        "/api/v1/equipment/individual/",
        json={
            "unit_id": test_unit.id,
            "equipment_type": "HMMWV",
            "tamcn": "D1195",
            "nomenclature": "HMMWV",
            "bumper_number": "OP-001",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403
