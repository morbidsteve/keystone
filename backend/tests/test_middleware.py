"""Tests for middleware: request logging and health endpoint."""

import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
async def test_request_logging_adds_request_id(client: AsyncClient):
    """Every response should include an X-Request-ID header."""
    resp = await client.get("/health")
    assert "x-request-id" in resp.headers
    # Request ID is an 8-char hex UUID prefix
    assert len(resp.headers["x-request-id"]) == 8


@pytest.mark.asyncio
async def test_request_id_is_unique(client: AsyncClient):
    """Each request gets a different X-Request-ID."""
    resp1 = await client.get("/health")
    resp2 = await client.get("/health")
    assert resp1.headers["x-request-id"] != resp2.headers["x-request-id"]


@pytest.mark.asyncio
async def test_health_endpoint_returns_service_info(client: AsyncClient):
    """GET /health returns service name and status fields."""
    resp = await client.get("/health")
    # Health check may return 200 or 503 depending on DB/Redis availability
    assert resp.status_code in (200, 503)
    data = resp.json()
    assert data["service"] == "KEYSTONE"
    assert "status" in data
    assert data["status"] in ("healthy", "degraded")


@pytest.mark.asyncio
async def test_health_endpoint_includes_database_check(client: AsyncClient):
    """Health check includes a database connectivity field."""
    resp = await client.get("/health")
    data = resp.json()
    assert "database" in data


@pytest.mark.asyncio
async def test_health_endpoint_includes_redis_check(client: AsyncClient):
    """Health check includes a Redis connectivity field."""
    resp = await client.get("/health")
    data = resp.json()
    assert "redis" in data


@pytest.mark.asyncio
async def test_authenticated_request_includes_request_id(
    client: AsyncClient, admin_token: str, admin_user: User
):
    """Authenticated API requests also get X-Request-ID headers."""
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert "x-request-id" in resp.headers
