"""Tests for supply API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.unit import Unit


@pytest.mark.asyncio
class TestSupplyEndpoints:
    async def test_create_supply_record(
        self, client: AsyncClient, admin_token: str, test_unit: Unit
    ):
        """Test creating a new supply status record."""
        response = await client.post(
            "/api/v1/supply/",
            json={
                "unit_id": test_unit.id,
                "supply_class": "III",
                "item_description": "JP-8 Fuel",
                "on_hand_qty": 45000.0,
                "required_qty": 60000.0,
                "dos": 4.5,
                "consumption_rate": 1200.0,
                "status": "AMBER",
                "source": "TEST",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["supply_class"] == "III"
        assert data["item_description"] == "JP-8 Fuel"
        assert data["on_hand_qty"] == 45000.0
        assert data["dos"] == 4.5
        assert data["status"] == "AMBER"
        assert "id" in data

    async def test_list_supply_records(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test listing supply records."""
        # Create test data
        for i in range(3):
            record = SupplyStatusRecord(
                unit_id=test_unit.id,
                supply_class=SupplyClass.I,
                item_description=f"Test Item {i}",
                on_hand_qty=100.0 + i * 10,
                required_qty=200.0,
                dos=5.0 + i,
                consumption_rate=10.0,
                status=SupplyStatus.GREEN,
                source="TEST",
            )
            db_session.add(record)
        await db_session.flush()

        response = await client.get(
            "/api/v1/supply/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    async def test_get_supply_record(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test getting a single supply record."""
        record = SupplyStatusRecord(
            unit_id=test_unit.id,
            supply_class=SupplyClass.V,
            item_description="5.56mm Ball",
            on_hand_qty=80000.0,
            required_qty=100000.0,
            dos=6.2,
            consumption_rate=2000.0,
            status=SupplyStatus.GREEN,
            source="TEST",
        )
        db_session.add(record)
        await db_session.flush()
        await db_session.refresh(record)

        response = await client.get(
            f"/api/v1/supply/{record.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == record.id
        assert data["supply_class"] == "V"

    async def test_update_supply_record(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test updating a supply record."""
        record = SupplyStatusRecord(
            unit_id=test_unit.id,
            supply_class=SupplyClass.III,
            item_description="Diesel",
            on_hand_qty=30000.0,
            required_qty=40000.0,
            dos=5.0,
            consumption_rate=800.0,
            status=SupplyStatus.GREEN,
            source="TEST",
        )
        db_session.add(record)
        await db_session.flush()
        await db_session.refresh(record)

        response = await client.put(
            f"/api/v1/supply/{record.id}",
            json={"on_hand_qty": 25000.0, "dos": 3.5, "status": "AMBER"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["on_hand_qty"] == 25000.0
        assert data["dos"] == 3.5
        assert data["status"] == "AMBER"

    async def test_filter_by_supply_class(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test filtering supply records by supply class."""
        for sc in [SupplyClass.I, SupplyClass.III, SupplyClass.V]:
            record = SupplyStatusRecord(
                unit_id=test_unit.id,
                supply_class=sc,
                item_description=f"Item {sc.value}",
                on_hand_qty=100.0,
                required_qty=200.0,
                dos=5.0,
                consumption_rate=10.0,
                status=SupplyStatus.GREEN,
                source="TEST",
            )
            db_session.add(record)
        await db_session.flush()

        response = await client.get(
            "/api/v1/supply/?supply_class=V",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert all(r["supply_class"] == "V" for r in data)

    async def test_get_nonexistent_record(self, client: AsyncClient, admin_token: str):
        """Test getting a non-existent supply record."""
        response = await client.get(
            "/api/v1/supply/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    async def test_unauthorized_access(self, client: AsyncClient):
        """Test that unauthenticated requests are rejected."""
        response = await client.get("/api/v1/supply/")
        assert response.status_code in (401, 403)  # No auth header
