"""Tests for medical tracking API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medical import (
    MedicalTreatmentFacility,
    MedicalTreatmentFacilityType,
    MTFStatus,
)
from app.models.unit import Unit
from app.models.user import User


@pytest.mark.asyncio
class TestMTFEndpoints:
    """Tests for /api/v1/medical/facilities endpoints."""

    async def test_list_facilities(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/facilities returns 200."""
        resp = await client.get(
            "/api/v1/medical/facilities",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_facilities_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/medical/facilities without token returns 401/403."""
        resp = await client.get("/api/v1/medical/facilities")
        assert resp.status_code in (401, 403)

    async def test_create_facility(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """POST /api/v1/medical/facilities creates a MTF."""
        resp = await client.post(
            "/api/v1/medical/facilities",
            json={
                "name": "BAS Alpha",
                "facility_type": "BAS",
                "callsign": "DUSTOFF1",
                "unit_id": test_unit.id,
                "latitude": 33.3,
                "longitude": -117.3,
                "status": "OPERATIONAL",
                "capacity": 10,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "BAS Alpha"
        assert data["facility_type"] == "BAS"

    async def test_get_facility(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/medical/facilities/{id} returns a single facility."""
        mtf = MedicalTreatmentFacility(
            name="STP Bravo",
            facility_type=MedicalTreatmentFacilityType.STP,
            unit_id=test_unit.id,
            status=MTFStatus.OPERATIONAL,
            capacity=20,
            current_census=5,
        )
        db_session.add(mtf)
        await db_session.flush()
        await db_session.refresh(mtf)

        resp = await client.get(
            f"/api/v1/medical/facilities/{mtf.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "STP Bravo"

    async def test_get_facility_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/facilities/99999 returns 404."""
        resp = await client.get(
            "/api/v1/medical/facilities/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_update_facility(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """PUT /api/v1/medical/facilities/{id} updates the facility."""
        mtf = MedicalTreatmentFacility(
            name="STP Update",
            facility_type=MedicalTreatmentFacilityType.STP,
            unit_id=test_unit.id,
            status=MTFStatus.OPERATIONAL,
            capacity=20,
            current_census=5,
        )
        db_session.add(mtf)
        await db_session.flush()
        await db_session.refresh(mtf)

        resp = await client.put(
            f"/api/v1/medical/facilities/{mtf.id}",
            json={"current_census": 10, "status": "DEGRADED"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "DEGRADED"


@pytest.mark.asyncio
class TestCasualtyEndpoints:
    """Tests for /api/v1/medical/casualties endpoints."""

    async def test_list_casualties(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/casualties returns 200."""
        resp = await client.get(
            "/api/v1/medical/casualties",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_get_casualty_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/casualties/NONEXISTENT returns 404."""
        resp = await client.get(
            "/api/v1/medical/casualties/NONEXISTENT-ID",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestBloodProductEndpoints:
    """Tests for /api/v1/medical/blood-products endpoints."""

    async def test_list_blood_products_facility_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/blood-products/99999 with no facility returns 404."""
        resp = await client.get(
            "/api/v1/medical/blood-products/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_list_blood_products(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """GET /api/v1/medical/blood-products/{facility_id} returns 200."""
        mtf = MedicalTreatmentFacility(
            name="Blood Bank MTF",
            facility_type=MedicalTreatmentFacilityType.ROLE2,
            unit_id=test_unit.id,
            status=MTFStatus.OPERATIONAL,
            capacity=30,
            current_census=10,
        )
        db_session.add(mtf)
        await db_session.flush()
        await db_session.refresh(mtf)

        resp = await client.get(
            f"/api/v1/medical/blood-products/{mtf.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestBurnRateEndpoints:
    """Tests for /api/v1/medical/burn-rates endpoints."""

    async def test_get_burn_rates(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        test_unit: Unit,
    ):
        """GET /api/v1/medical/burn-rates/{unit_id} returns data."""
        resp = await client.get(
            f"/api/v1/medical/burn-rates/{test_unit.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        # May return 200 with data or an empty result
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestNearestFacility:
    """Tests for /api/v1/medical/facilities/nearest endpoint."""

    async def test_nearest_facility(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/facilities/nearest returns results."""
        resp = await client.get(
            "/api/v1/medical/facilities/nearest?lat=33.3&lon=-117.3",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        # Returns 200 even if no facilities exist (empty list)
        assert resp.status_code == 200

    async def test_nearest_facility_invalid_coords(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/medical/facilities/nearest with bad coords returns 422."""
        resp = await client.get(
            "/api/v1/medical/facilities/nearest?lat=999&lon=-117.3",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 422
