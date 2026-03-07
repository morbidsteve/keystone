"""Tests for the authentication API endpoints."""

import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
async def test_login_valid_credentials(client: AsyncClient, admin_user: User):
    """POST /api/v1/auth/login with valid credentials returns 200 and a JWT token."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["username"] == "testadmin"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, admin_user: User):
    """POST /api/v1/auth/login with wrong password returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "wrongpassword"},
    )
    assert resp.status_code == 401
    assert "Invalid" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """POST /api/v1/auth/login with non-existent user returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "nouser", "password": "whatever"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_rate_limiting(client: AsyncClient, admin_user: User):
    """5 failed login attempts should trigger rate limiting (429)."""
    # Clear any previous state in the module-level dict
    from app.api.auth import _login_failures
    _login_failures.clear()

    for _ in range(5):
        await client.post(
            "/api/v1/auth/login",
            json={"username": "testadmin", "password": "wrong"},
        )

    # 6th attempt should be rate-limited
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "wrong"},
    )
    assert resp.status_code == 429
    assert "locked" in resp.json()["detail"].lower()

    # Clean up
    _login_failures.clear()


@pytest.mark.asyncio
async def test_login_rate_limit_cleared_on_success(client: AsyncClient, admin_user: User):
    """Successful login clears the rate-limit counter."""
    from app.api.auth import _login_failures
    _login_failures.clear()

    # Record 3 failures
    for _ in range(3):
        await client.post(
            "/api/v1/auth/login",
            json={"username": "testadmin", "password": "bad"},
        )

    # Successful login should clear failures
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert "testadmin" not in _login_failures

    _login_failures.clear()


@pytest.mark.asyncio
async def test_get_me_with_valid_token(client: AsyncClient, admin_user: User, admin_token: str):
    """GET /api/v1/auth/me with valid token returns user data."""
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"
    assert "permissions" in data


@pytest.mark.asyncio
async def test_get_me_without_token(client: AsyncClient):
    """GET /api/v1/auth/me without token returns 401 or 403."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_me_with_invalid_token(client: AsyncClient):
    """GET /api/v1/auth/me with garbage token returns 401."""
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalidtokenhere"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_register_as_admin(
    client: AsyncClient, admin_user: User, admin_token: str, test_unit
):
    """POST /api/v1/auth/register as admin creates a new user (201)."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "SecurePass123",
            "full_name": "New User",
            "role": "viewer",
            "unit_id": test_unit.id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "newuser"
    assert data["role"] == "viewer"


@pytest.mark.asyncio
async def test_register_as_non_admin(
    client: AsyncClient, operator_user: User, operator_token: str, test_unit
):
    """POST /api/v1/auth/register as operator returns 403."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "blocked",
            "email": "blocked@test.com",
            "password": "SecurePass123",
            "full_name": "Blocked User",
            "role": "viewer",
            "unit_id": test_unit.id,
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_register_duplicate_username(
    client: AsyncClient, admin_user: User, admin_token: str, test_unit
):
    """POST /api/v1/auth/register with existing username returns 409."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testadmin",
            "email": "different@test.com",
            "password": "SecurePass123",
            "full_name": "Duplicate User",
            "role": "viewer",
            "unit_id": test_unit.id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 409
    assert "Username" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_email(
    client: AsyncClient, admin_user: User, admin_token: str, test_unit
):
    """POST /api/v1/auth/register with existing email returns 409."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "uniqueuser",
            "email": "testadmin@test.com",
            "password": "SecurePass123",
            "full_name": "Dup Email User",
            "role": "viewer",
            "unit_id": test_unit.id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 409
    assert "Email" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_register_weak_password(
    client: AsyncClient, admin_user: User, admin_token: str, test_unit
):
    """POST /api/v1/auth/register with weak password returns 422."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "weakpwuser",
            "email": "weak@test.com",
            "password": "short",
            "full_name": "Weak Password",
            "role": "viewer",
            "unit_id": test_unit.id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_users_as_admin(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """GET /api/v1/auth/users as admin returns user list."""
    resp = await client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(u["username"] == "testadmin" for u in data)


@pytest.mark.asyncio
async def test_list_users_as_non_admin(
    client: AsyncClient, operator_user: User, operator_token: str
):
    """GET /api/v1/auth/users as operator returns 403."""
    resp = await client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_login_returns_permissions(client: AsyncClient, admin_user: User):
    """Login response includes a permissions list."""
    from app.api.auth import _login_failures
    _login_failures.clear()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "permissions" in data["user"]
    assert isinstance(data["user"]["permissions"], list)
    # Admin should have many permissions
    assert len(data["user"]["permissions"]) > 10
