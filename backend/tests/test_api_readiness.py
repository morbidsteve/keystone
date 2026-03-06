"""Tests for readiness score API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.unit import Unit
from app.models.user import User


@pytest.mark.asyncio
class TestReadinessEndpoints:
    """Tests for /api/v1/readiness/ endpoints."""

    # ---- Dashboard ----

    async def test_readiness_dashboard(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/readiness/ returns dashboard with unit entries."""
        resp = await client.get(
            "/api/v1/readiness/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "units" in data
        assert "unit_count" in data
        assert isinstance(data["units"], list)

    async def test_readiness_dashboard_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/readiness/ without token returns 401/403."""
        resp = await client.get("/api/v1/readiness/")
        assert resp.status_code in (401, 403)

    # ---- Unit readiness snapshot ----

    async def test_get_readiness_no_snapshot(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id} with no snapshot returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_get_readiness_nonexistent_unit(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/readiness/99999 for nonexistent unit returns 403/404."""
        resp = await client.get(
            "/api/v1/readiness/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code in (403, 404)

    # ---- Unit strength ----

    async def test_get_unit_strength_no_data(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/strength/{unit_id} with no data returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/strength/{test_unit.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    # ---- Readiness history ----

    async def test_readiness_history_no_data(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/history with no snapshots returns valid response."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/history",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["unit_id"] == test_unit.id
        assert data["snapshot_count"] == 0

    # ---- Readiness rollup ----

    async def test_readiness_rollup(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/rollup returns rollup data."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/rollup",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        # Should return 200 even without data (rollup computes from children)
        assert resp.status_code == 200

    # ---- Drill-down detail endpoints ----

    async def test_equipment_detail_no_snapshot(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/equipment-detail without snapshot returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/equipment-detail",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_supply_detail_no_snapshot(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/supply-detail without snapshot returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/supply-detail",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_personnel_detail_no_snapshot(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/personnel-detail without snapshot returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/personnel-detail",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_training_detail_no_snapshot(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/readiness/{unit_id}/training-detail without snapshot returns 404."""
        resp = await client.get(
            f"/api/v1/readiness/{test_unit.id}/training-detail",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404
