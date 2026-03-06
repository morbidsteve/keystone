"""Tests for transportation / movement API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit
from app.models.user import User


@pytest.mark.asyncio
class TestMovementEndpoints:
    """Tests for /api/v1/transportation/ endpoints."""

    # ---- List ----

    async def test_list_movements(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/transportation/ returns 200."""
        resp = await client.get(
            "/api/v1/transportation/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_movements_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/transportation/ without token returns 401/403."""
        resp = await client.get("/api/v1/transportation/")
        assert resp.status_code in (401, 403)

    async def test_list_active_movements(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/transportation/active returns only active movements."""
        for status in [MovementStatus.EN_ROUTE, MovementStatus.PLANNED, MovementStatus.COMPLETE]:
            mv = Movement(
                unit_id=test_unit.id,
                origin="Origin",
                destination="Dest",
                vehicle_count=3,
                status=status,
            )
            db_session.add(mv)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/transportation/active",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        statuses = {m["status"] for m in data}
        # Active endpoint only returns EN_ROUTE or DELAYED
        assert statuses <= {"EN_ROUTE", "DELAYED"}

    async def test_list_movement_history(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/transportation/history returns COMPLETE movements."""
        mv = Movement(
            unit_id=test_unit.id,
            origin="Camp Alpha",
            destination="Camp Bravo",
            vehicle_count=2,
            status=MovementStatus.COMPLETE,
        )
        db_session.add(mv)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/transportation/history",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200

    # ---- Get single ----

    async def test_get_movement(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_movement: Movement,
    ):
        """GET /api/v1/transportation/{id} returns the movement."""
        resp = await client.get(
            f"/api/v1/transportation/{test_movement.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["origin"] == "Camp Pendleton"
        assert data["destination"] == "Camp Lejeune"

    async def test_get_movement_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/transportation/99999 returns 404."""
        resp = await client.get(
            "/api/v1/transportation/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    # ---- Create ----

    async def test_create_movement(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """POST /api/v1/transportation/ creates a new movement."""
        resp = await client.post(
            "/api/v1/transportation/",
            json={
                "unit_id": test_unit.id,
                "origin": "Camp Pendleton",
                "destination": "29 Palms",
                "vehicle_count": 10,
                "status": "PLANNED",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["origin"] == "Camp Pendleton"
        assert data["destination"] == "29 Palms"
        assert data["vehicle_count"] == 10

    async def test_create_movement_operator_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        operator_user: User,
        test_unit: Unit,
    ):
        """POST /api/v1/transportation/ as OPERATOR returns 403."""
        resp = await client.post(
            "/api/v1/transportation/",
            json={
                "unit_id": test_unit.id,
                "origin": "A",
                "destination": "B",
                "vehicle_count": 1,
                "status": "PLANNED",
            },
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert resp.status_code == 403

    # ---- Update ----

    async def test_update_movement(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_movement: Movement,
    ):
        """PUT /api/v1/transportation/{id} updates the movement."""
        resp = await client.put(
            f"/api/v1/transportation/{test_movement.id}",
            json={"status": "EN_ROUTE", "vehicle_count": 8},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "EN_ROUTE"
        assert data["vehicle_count"] == 8

    async def test_update_movement_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """PUT /api/v1/transportation/99999 returns 404."""
        resp = await client.put(
            "/api/v1/transportation/99999",
            json={"status": "EN_ROUTE"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    # ---- Filter ----

    async def test_filter_by_status(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/transportation/?status=PLANNED filters correctly."""
        mv = Movement(
            unit_id=test_unit.id,
            origin="X",
            destination="Y",
            vehicle_count=1,
            status=MovementStatus.PLANNED,
        )
        db_session.add(mv)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/transportation/?status=PLANNED",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert all(m["status"] == "PLANNED" for m in data)
