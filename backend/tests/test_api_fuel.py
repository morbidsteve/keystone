"""Tests for fuel management API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fuel import (
    FuelFacilityType,
    FuelStoragePoint,
    FuelStorageStatus,
    FuelType,
)
from app.models.unit import Unit
from app.models.user import User


@pytest.mark.asyncio
class TestFuelStoragePointEndpoints:
    """Tests for /api/v1/fuel/storage-points endpoints."""

    async def test_list_storage_points_empty(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/fuel/storage-points returns 200 with empty list."""
        resp = await client.get(
            "/api/v1/fuel/storage-points",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_storage_points_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/fuel/storage-points without token returns 401/403."""
        resp = await client.get("/api/v1/fuel/storage-points")
        assert resp.status_code in (401, 403)

    async def test_create_storage_point(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """POST /api/v1/fuel/storage-points creates a fuel storage point."""
        resp = await client.post(
            "/api/v1/fuel/storage-points",
            json={
                "unit_id": test_unit.id,
                "name": "FSP Alpha",
                "facility_type": "FSP",
                "fuel_type": "JP8",
                "capacity_gallons": 50000.0,
                "current_gallons": 25000.0,
                "latitude": 33.3,
                "longitude": -117.3,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "FSP Alpha"
        assert data["capacity_gallons"] == 50000.0
        assert data["current_gallons"] == 25000.0

    async def test_get_storage_point(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/fuel/storage-points/{id} returns a single point."""
        sp = FuelStoragePoint(
            unit_id=test_unit.id,
            name="FARP Bravo",
            facility_type=FuelFacilityType.FARP,
            fuel_type=FuelType.JP8,
            capacity_gallons=10000.0,
            current_gallons=5000.0,
            status=FuelStorageStatus.OPERATIONAL,
        )
        db_session.add(sp)
        await db_session.flush()
        await db_session.refresh(sp)

        resp = await client.get(
            f"/api/v1/fuel/storage-points/{sp.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "FARP Bravo"

    async def test_get_storage_point_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/fuel/storage-points/99999 returns 404."""
        resp = await client.get(
            "/api/v1/fuel/storage-points/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_update_storage_point(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """PUT /api/v1/fuel/storage-points/{id} updates the record."""
        sp = FuelStoragePoint(
            unit_id=test_unit.id,
            name="FSP Charlie",
            facility_type=FuelFacilityType.FSP,
            fuel_type=FuelType.DF2,
            capacity_gallons=20000.0,
            current_gallons=10000.0,
        )
        db_session.add(sp)
        await db_session.flush()
        await db_session.refresh(sp)

        resp = await client.put(
            f"/api/v1/fuel/storage-points/{sp.id}",
            json={"name": "FSP Charlie Updated"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "FSP Charlie Updated"

    async def test_delete_storage_point(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """DELETE /api/v1/fuel/storage-points/{id} removes the record (admin only)."""
        sp = FuelStoragePoint(
            unit_id=test_unit.id,
            name="FSP Delete Me",
            facility_type=FuelFacilityType.FSP,
            fuel_type=FuelType.MOGAS,
            capacity_gallons=5000.0,
            current_gallons=0.0,
        )
        db_session.add(sp)
        await db_session.flush()
        await db_session.refresh(sp)

        resp = await client.delete(
            f"/api/v1/fuel/storage-points/{sp.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 204

    async def test_delete_storage_point_operator_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        operator_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """DELETE /api/v1/fuel/storage-points/{id} as operator returns 403."""
        sp = FuelStoragePoint(
            unit_id=test_unit.id,
            name="FSP No Delete",
            facility_type=FuelFacilityType.FSP,
            fuel_type=FuelType.JP8,
            capacity_gallons=5000.0,
            current_gallons=0.0,
        )
        db_session.add(sp)
        await db_session.flush()
        await db_session.refresh(sp)

        resp = await client.delete(
            f"/api/v1/fuel/storage-points/{sp.id}",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestFuelTransactionEndpoints:
    """Tests for /api/v1/fuel/transactions endpoints."""

    async def test_list_transactions_empty(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/fuel/transactions returns 200 for authenticated user."""
        resp = await client.get(
            "/api/v1/fuel/transactions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_create_transaction_receipt(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """POST /api/v1/fuel/transactions creates a fuel receipt."""
        sp = FuelStoragePoint(
            unit_id=test_unit.id,
            name="FSP Txn Test",
            facility_type=FuelFacilityType.FSP,
            fuel_type=FuelType.JP8,
            capacity_gallons=50000.0,
            current_gallons=10000.0,
            status=FuelStorageStatus.OPERATIONAL,
        )
        db_session.add(sp)
        await db_session.flush()
        await db_session.refresh(sp)

        resp = await client.post(
            "/api/v1/fuel/transactions",
            json={
                "storage_point_id": sp.id,
                "transaction_type": "RECEIPT",
                "fuel_type": "JP8",
                "quantity_gallons": 5000.0,
                "document_number": "DOC-001",
                "notes": "Resupply delivery",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["quantity_gallons"] == 5000.0
        assert data["transaction_type"] == "RECEIPT"


@pytest.mark.asyncio
class TestFuelConsumptionRates:
    """Tests for /api/v1/fuel/consumption-rates endpoints."""

    async def test_list_consumption_rates(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/fuel/consumption-rates returns 200."""
        resp = await client.get(
            "/api/v1/fuel/consumption-rates",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_update_consumption_rate_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """PUT /api/v1/fuel/consumption-rates/99999 returns 404."""
        resp = await client.put(
            "/api/v1/fuel/consumption-rates/99999",
            json={"gallons_per_hour_idle": 2.5},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404
