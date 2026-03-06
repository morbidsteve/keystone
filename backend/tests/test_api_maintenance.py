"""Tests for the maintenance API endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance import MaintenanceWorkOrder, WorkOrderStatus
from app.models.unit import Unit
from app.models.user import User


@pytest_asyncio.fixture
async def test_work_order(db_session: AsyncSession, test_unit: Unit):
    """Create a test maintenance work order."""
    wo = MaintenanceWorkOrder(
        unit_id=test_unit.id,
        work_order_number="WO-TEST-001",
        description="Replace left front tire",
        status=WorkOrderStatus.OPEN,
        priority=2,
        location="Motor Pool Bay 3",
    )
    db_session.add(wo)
    await db_session.flush()
    await db_session.refresh(wo)
    return wo


@pytest_asyncio.fixture
async def test_work_order_in_progress(db_session: AsyncSession, test_unit: Unit):
    """Create an in-progress work order."""
    wo = MaintenanceWorkOrder(
        unit_id=test_unit.id,
        work_order_number="WO-TEST-002",
        description="Engine oil change",
        status=WorkOrderStatus.IN_PROGRESS,
        priority=3,
    )
    db_session.add(wo)
    await db_session.flush()
    await db_session.refresh(wo)
    return wo


@pytest.mark.asyncio
async def test_list_work_orders(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
):
    """GET /api/v1/maintenance/ returns list of work orders."""
    resp = await client.get(
        "/api/v1/maintenance/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(w["work_order_number"] == "WO-TEST-001" for w in data)


@pytest.mark.asyncio
async def test_list_work_orders_filter_status(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
    test_work_order_in_progress: MaintenanceWorkOrder,
):
    """GET /api/v1/maintenance/?status=OPEN returns only OPEN work orders."""
    resp = await client.get(
        "/api/v1/maintenance/?status=OPEN",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    for wo in data:
        assert wo["status"] == "OPEN"


@pytest.mark.asyncio
async def test_get_work_order_detail(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
):
    """GET /api/v1/maintenance/{id} returns work order with parts and labor."""
    resp = await client.get(
        f"/api/v1/maintenance/{test_work_order.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["work_order_number"] == "WO-TEST-001"
    assert "parts" in data
    assert "labor_entries" in data


@pytest.mark.asyncio
async def test_get_work_order_not_found(
    client: AsyncClient, admin_token: str, admin_user: User
):
    """GET /api/v1/maintenance/99999 returns 404."""
    resp = await client.get(
        "/api/v1/maintenance/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_work_order(
    client: AsyncClient, admin_token: str, admin_user: User, test_unit: Unit
):
    """POST /api/v1/maintenance/ creates a new work order."""
    resp = await client.post(
        "/api/v1/maintenance/",
        json={
            "unit_id": test_unit.id,
            "work_order_number": "WO-NEW-001",
            "description": "Brake pad replacement",
            "status": "OPEN",
            "priority": 1,
            "location": "Motor Pool",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["work_order_number"] == "WO-NEW-001"
    assert data["priority"] == 1
    assert data["status"] == "OPEN"


@pytest.mark.asyncio
async def test_update_work_order(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
):
    """PUT /api/v1/maintenance/{id} updates work order fields."""
    resp = await client.put(
        f"/api/v1/maintenance/{test_work_order.id}",
        json={
            "status": "IN_PROGRESS",
            "description": "Replace left front tire - parts received",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "IN_PROGRESS"
    assert "parts received" in data["description"]


@pytest.mark.asyncio
async def test_delete_work_order_admin(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
):
    """DELETE /api/v1/maintenance/{id} removes work order (admin only)."""
    resp = await client.delete(
        f"/api/v1/maintenance/{test_work_order.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204

    # Confirm it's gone
    resp2 = await client.get(
        f"/api/v1/maintenance/{test_work_order.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_operator_cannot_create_work_order(
    client: AsyncClient,
    operator_token: str,
    operator_user: User,
    test_unit: Unit,
):
    """Operator role cannot create work orders (403)."""
    resp = await client.post(
        "/api/v1/maintenance/",
        json={
            "unit_id": test_unit.id,
            "work_order_number": "WO-BLOCKED",
            "description": "Should not work",
            "priority": 3,
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_maintenance_unauthenticated(client: AsyncClient):
    """GET /api/v1/maintenance/ without auth returns 401/403."""
    resp = await client.get("/api/v1/maintenance/")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_work_order_status_transition(
    client: AsyncClient,
    admin_token: str,
    admin_user: User,
    test_work_order: MaintenanceWorkOrder,
):
    """Update work order through status transitions: OPEN -> IN_PROGRESS -> COMPLETE."""
    # OPEN -> IN_PROGRESS
    resp1 = await client.put(
        f"/api/v1/maintenance/{test_work_order.id}",
        json={"status": "IN_PROGRESS"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "IN_PROGRESS"

    # IN_PROGRESS -> COMPLETE
    resp2 = await client.put(
        f"/api/v1/maintenance/{test_work_order.id}",
        json={"status": "COMPLETE"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "COMPLETE"
