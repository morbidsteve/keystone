"""Tests for the personnel API endpoints."""

import pytest
from httpx import AsyncClient

from app.models.personnel import Personnel, PersonnelStatus


@pytest.mark.asyncio
async def test_create_personnel(client: AsyncClient, admin_token: str):
    """Create a basic personnel record."""
    resp = await client.post(
        "/api/v1/personnel/",
        json={
            "edipi": "9876543210",
            "first_name": "Jane",
            "last_name": "Smith",
            "rank": "Cpl",
            "mos": "0311",
            "blood_type": "A+",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["edipi"] == "9876543210"
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Smith"
    assert data["status"] == "ACTIVE"
    assert data["weapons"] == []
    assert data["ammo_loads"] == []


@pytest.mark.asyncio
async def test_create_personnel_with_weapons(client: AsyncClient, admin_token: str):
    """Create personnel with nested weapons and ammo."""
    resp = await client.post(
        "/api/v1/personnel/",
        json={
            "edipi": "1111111111",
            "first_name": "Mike",
            "last_name": "Johnson",
            "rank": "LCpl",
            "mos": "0331",
            "weapons": [
                {
                    "weapon_type": "M240B",
                    "serial_number": "M240-99999",
                    "optic": None,
                    "accessories": ["Tripod", "T&E"],
                }
            ],
            "ammo_loads": [
                {
                    "caliber": "7.62mm",
                    "magazine_count": 4,
                    "rounds_per_magazine": 100,
                }
            ],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["weapons"]) == 1
    assert data["weapons"][0]["weapon_type"] == "M240B"
    assert data["weapons"][0]["accessories"] == ["Tripod", "T&E"]
    assert len(data["ammo_loads"]) == 1
    assert data["ammo_loads"][0]["total_rounds"] == 400


@pytest.mark.asyncio
async def test_create_duplicate_edipi(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Duplicate EDIPI should return 409."""
    resp = await client.post(
        "/api/v1/personnel/",
        json={
            "edipi": test_personnel.edipi,
            "first_name": "Duplicate",
            "last_name": "Person",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_invalid_edipi(client: AsyncClient, admin_token: str):
    """Invalid EDIPI format should return 422."""
    resp = await client.post(
        "/api/v1/personnel/",
        json={
            "edipi": "ABC",
            "first_name": "Bad",
            "last_name": "Edipi",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_personnel(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """List should return personnel accessible to the user."""
    resp = await client.get(
        "/api/v1/personnel/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any(p["edipi"] == test_personnel.edipi for p in data)


@pytest.mark.asyncio
async def test_search_personnel(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Search by EDIPI prefix."""
    resp = await client.get(
        f"/api/v1/personnel/search?q={test_personnel.edipi[:5]}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_personnel_detail(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Get detail with weapons and ammo."""
    resp = await client.get(
        f"/api/v1/personnel/{test_personnel.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["edipi"] == test_personnel.edipi
    assert "weapons" in data
    assert "ammo_loads" in data


@pytest.mark.asyncio
async def test_update_personnel(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Update personnel fields."""
    resp = await client.put(
        f"/api/v1/personnel/{test_personnel.id}",
        json={"rank": "SSgt", "mos": "0369"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rank"] == "SSgt"
    assert data["mos"] == "0369"


@pytest.mark.asyncio
async def test_delete_personnel_soft(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Delete should soft-delete (set INACTIVE)."""
    resp = await client.delete(
        f"/api/v1/personnel/{test_personnel.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204

    # Verify it's now INACTIVE
    resp2 = await client.get(
        f"/api/v1/personnel/{test_personnel.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "INACTIVE"


@pytest.mark.asyncio
async def test_add_weapon(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Add a weapon to a personnel record."""
    resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/weapons",
        json={
            "weapon_type": "M4A1",
            "serial_number": "M4-TEST-001",
            "optic": "ACOG TA31",
            "accessories": ["PEQ-15"],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["weapon_type"] == "M4A1"
    assert data["serial_number"] == "M4-TEST-001"
    return data["id"]


@pytest.mark.asyncio
async def test_update_weapon(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Add then update a weapon."""
    # Create weapon first
    create_resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/weapons",
        json={"weapon_type": "M9", "serial_number": "M9-TEST-001"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    weapon_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/v1/personnel/{test_personnel.id}/weapons/{weapon_id}",
        json={"optic": "RMR"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["optic"] == "RMR"


@pytest.mark.asyncio
async def test_delete_weapon(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Add then delete a weapon."""
    create_resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/weapons",
        json={"weapon_type": "M9", "serial_number": "M9-DEL-001"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    weapon_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/v1/personnel/{test_personnel.id}/weapons/{weapon_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_add_ammo_load(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Add ammo and verify total_rounds computed."""
    resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/ammo-loads",
        json={
            "caliber": "5.56mm",
            "magazine_count": 7,
            "rounds_per_magazine": 30,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["caliber"] == "5.56mm"
    assert data["total_rounds"] == 210  # 7 * 30


@pytest.mark.asyncio
async def test_update_ammo_load(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Update ammo and verify total_rounds recomputed."""
    create_resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/ammo-loads",
        json={"caliber": "9mm", "magazine_count": 3, "rounds_per_magazine": 15},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ammo_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/v1/personnel/{test_personnel.id}/ammo-loads/{ammo_id}",
        json={"magazine_count": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total_rounds"] == 75  # 5 * 15


@pytest.mark.asyncio
async def test_delete_ammo_load(client: AsyncClient, admin_token: str, test_personnel: Personnel):
    """Add then delete an ammo load."""
    create_resp = await client.post(
        f"/api/v1/personnel/{test_personnel.id}/ammo-loads",
        json={"caliber": "7.62mm", "magazine_count": 2, "rounds_per_magazine": 100},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ammo_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/v1/personnel/{test_personnel.id}/ammo-loads/{ammo_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_operator_cannot_create(client: AsyncClient, operator_token: str):
    """Operator role should be forbidden from creating personnel."""
    resp = await client.post(
        "/api/v1/personnel/",
        json={
            "edipi": "5555555555",
            "first_name": "Blocked",
            "last_name": "User",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_access(client: AsyncClient):
    """No auth header should return 401 or 403."""
    resp = await client.get("/api/v1/personnel/")
    assert resp.status_code in (401, 403)
