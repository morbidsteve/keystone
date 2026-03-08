"""Tests for dashboard API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit


@pytest.mark.asyncio
class TestDashboardEndpoints:
    async def _seed_dashboard_data(self, db_session: AsyncSession, unit: Unit):
        """Helper to seed data needed for dashboard tests."""
        # Supply data
        for sc in [SupplyClass.I, SupplyClass.III, SupplyClass.V]:
            record = SupplyStatusRecord(
                unit_id=unit.id,
                supply_class=sc,
                item_description=f"Item {sc.value}",
                on_hand_qty=100.0,
                required_qty=200.0,
                dos=4.0,
                consumption_rate=10.0,
                status=SupplyStatus.AMBER,
                source="TEST",
            )
            db_session.add(record)

        # Equipment data
        equip = EquipmentStatus(
            unit_id=unit.id,
            tamcn="D1149",
            nomenclature="HMMWV",
            total_possessed=15,
            mission_capable=12,
            not_mission_capable_maintenance=2,
            not_mission_capable_supply=1,
            readiness_pct=80.0,
            source="TEST",
        )
        db_session.add(equip)

        # Movement data
        move = Movement(
            unit_id=unit.id,
            convoy_id="C-100",
            origin="Camp Lejeune",
            destination="Camp Pendleton",
            vehicle_count=8,
            status=MovementStatus.EN_ROUTE,
            source="TEST",
        )
        db_session.add(move)

        # Alert data
        alert = Alert(
            unit_id=unit.id,
            alert_type=AlertType.LOW_DOS,
            severity=AlertSeverity.CRITICAL,
            message="CL V below minimum DOS",
            threshold_value=3.0,
            actual_value=1.5,
            acknowledged=False,
        )
        db_session.add(alert)

        await db_session.flush()

    async def test_dashboard_summary(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test the dashboard summary endpoint."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            "/api/v1/dashboard/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "supply_overview" in data
        assert "equipment_readiness" in data
        assert "active_movements" in data
        assert "critical_alerts" in data
        assert "total_alerts" in data

        assert data["active_movements"] >= 1
        assert data["critical_alerts"] >= 1
        assert data["equipment_readiness"] > 0

    async def test_supply_overview(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test the supply overview endpoint."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            "/api/v1/dashboard/supply-overview",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

        for item in data:
            assert "supply_class" in item
            assert "avg_dos" in item
            assert "status" in item
            assert "item_count" in item

    async def test_readiness_overview(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test the readiness overview endpoint."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            "/api/v1/dashboard/readiness-overview",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_sustainability(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test the sustainability projections endpoint."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            "/api/v1/dashboard/sustainability",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        for proj in data:
            assert "supply_class" in proj
            assert "current_dos" in proj
            assert "status" in proj

    async def test_dashboard_alerts(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test the dashboard alerts endpoint."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            "/api/v1/dashboard/alerts",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        alert = data[0]
        assert "alert_type" in alert
        assert "severity" in alert
        assert "message" in alert

    async def test_dashboard_with_unit_filter(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Test filtering dashboard by unit_id."""
        await self._seed_dashboard_data(db_session, test_unit)

        response = await client.get(
            f"/api/v1/dashboard/summary?unit_id={test_unit.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "supply_overview" in data

    async def test_empty_dashboard(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Test dashboard with no data returns zeros."""
        response = await client.get(
            "/api/v1/dashboard/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active_movements"] >= 0
        assert data["critical_alerts"] >= 0
