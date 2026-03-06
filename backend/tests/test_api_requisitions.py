"""Tests for requisition workflow API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requisition import (
    Requisition,
    RequisitionLineItem,
    RequisitionPriority,
    RequisitionStatus,
)
from app.models.unit import Unit
from app.models.user import User


@pytest.mark.asyncio
class TestRequisitionEndpoints:
    """Tests for /api/v1/requisitions/ endpoints."""

    # ---- List ----

    async def test_list_requisitions_authenticated(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
    ):
        """GET /api/v1/requisitions/ returns 200 for authenticated user."""
        resp = await client.get(
            "/api/v1/requisitions/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_requisitions_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/requisitions/ without token returns 401/403."""
        resp = await client.get("/api/v1/requisitions/")
        assert resp.status_code in (401, 403)

    async def test_list_requisitions_with_data(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/requisitions/ returns seeded data."""
        req = Requisition(
            requisition_number="REQ-TEST-001",
            unit_id=test_unit.id,
            requested_by_id=admin_user.id,
            status=RequisitionStatus.DRAFT,
            priority=RequisitionPriority.P08,
            justification="Unit test requisition",
        )
        db_session.add(req)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/requisitions/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        numbers = [r["requisition_number"] for r in data]
        assert "REQ-TEST-001" in numbers

    async def test_list_requisitions_filter_status(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/requisitions/?status=DRAFT filters correctly."""
        for i, st in enumerate([RequisitionStatus.DRAFT, RequisitionStatus.SUBMITTED]):
            req = Requisition(
                requisition_number=f"REQ-FILT-{i:03d}",
                unit_id=test_unit.id,
                requested_by_id=admin_user.id,
                status=st,
                priority=RequisitionPriority.P08,
            )
            db_session.add(req)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/requisitions/?status=DRAFT",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert all(r["status"] == "DRAFT" for r in data)

    # ---- Detail ----

    async def test_get_requisition_detail(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/requisitions/{id} returns the requisition."""
        req = Requisition(
            requisition_number="REQ-DET-001",
            unit_id=test_unit.id,
            requested_by_id=admin_user.id,
            status=RequisitionStatus.DRAFT,
            priority=RequisitionPriority.P03,
            justification="Detail test",
        )
        db_session.add(req)
        await db_session.flush()
        await db_session.refresh(req)

        resp = await client.get(
            f"/api/v1/requisitions/{req.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["requisition_number"] == "REQ-DET-001"
        assert data["priority"] == "03"

    async def test_get_requisition_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/requisitions/99999 returns 404."""
        resp = await client.get(
            "/api/v1/requisitions/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    # ---- Create ----

    async def test_create_requisition(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """POST /api/v1/requisitions/ creates a new draft requisition."""
        resp = await client.post(
            "/api/v1/requisitions/",
            json={
                "unit_id": test_unit.id,
                "priority": "03",
                "justification": "Need supplies urgently",
                "delivery_location": "Camp Pendleton Warehouse",
                "line_items": [
                    {
                        "nomenclature": "MRE Case A",
                        "quantity": 100,
                        "unit_of_issue": "CS",
                        "nsn": "8970-00-149-1094",
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "DRAFT"
        assert data["unit_id"] == test_unit.id

    async def test_create_requisition_unauthenticated(self, client: AsyncClient):
        """POST /api/v1/requisitions/ without token returns 401/403."""
        resp = await client.post(
            "/api/v1/requisitions/",
            json={
                "unit_id": 1,
                "priority": "08",
                "justification": "Test",
                "line_items": [
                    {"nomenclature": "Widget", "quantity": 1, "unit_of_issue": "EA"}
                ],
            },
        )
        assert resp.status_code in (401, 403)

    async def test_create_requisition_viewer_forbidden(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """POST /api/v1/requisitions/ as VIEWER returns 403."""
        from app.core.auth import create_access_token, hash_password
        from app.models.user import Role, User

        viewer = User(
            username="viewerreq",
            email="viewerreq@test.com",
            hashed_password=hash_password("testpass123"),
            full_name="Viewer Req",
            role=Role.VIEWER,
            unit_id=test_unit.id,
        )
        db_session.add(viewer)
        await db_session.flush()
        await db_session.refresh(viewer)

        token = create_access_token(
            data={
                "sub": viewer.username,
                "role": viewer.role.value,
                "unit_id": viewer.unit_id,
            }
        )
        resp = await client.post(
            "/api/v1/requisitions/",
            json={
                "unit_id": test_unit.id,
                "priority": "08",
                "justification": "Test",
                "line_items": [
                    {"nomenclature": "Widget", "quantity": 1, "unit_of_issue": "EA"}
                ],
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    # ---- History ----

    async def test_get_history_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/requisitions/99999/history returns 404."""
        resp = await client.get(
            "/api/v1/requisitions/99999/history",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404
