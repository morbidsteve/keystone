"""Tests for the /health endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoint:
    """Tests for the /health health check endpoint."""

    async def test_health_returns_response(self, client: AsyncClient):
        """GET /health returns 200 or 503."""
        resp = await client.get("/health")
        assert resp.status_code in (200, 503)
        data = resp.json()
        assert data["service"] == "KEYSTONE"
        assert "status" in data
        assert "database" in data

    async def test_health_database_field(self, client: AsyncClient):
        """GET /health includes database connectivity status."""
        resp = await client.get("/health")
        data = resp.json()
        assert "database" in data
        assert isinstance(data["database"], str)

    async def test_health_redis_field(self, client: AsyncClient):
        """GET /health includes Redis connectivity status (may be error in test)."""
        resp = await client.get("/health")
        data = resp.json()
        assert "redis" in data
        assert isinstance(data["redis"], str)
        # Redis won't be running in test env, so expect either connected or error
        assert data["redis"].startswith("connected") or data["redis"].startswith(
            "error"
        )

    async def test_health_status_values(self, client: AsyncClient):
        """GET /health status is either 'healthy' or 'degraded'."""
        resp = await client.get("/health")
        data = resp.json()
        assert data["status"] in ("healthy", "degraded")

    async def test_health_degraded_returns_503(self, client: AsyncClient):
        """GET /health returns 503 when status is degraded."""
        resp = await client.get("/health")
        data = resp.json()
        if data["status"] == "degraded":
            assert resp.status_code == 503
        else:
            assert resp.status_code == 200

    async def test_health_response_structure(self, client: AsyncClient):
        """GET /health response has the expected keys."""
        resp = await client.get("/health")
        data = resp.json()
        expected_keys = {"service", "status", "database", "redis"}
        assert expected_keys == set(data.keys())

    async def test_health_no_auth_required(self, client: AsyncClient):
        """GET /health does not require authentication."""
        resp = await client.get("/health")
        assert resp.status_code in (200, 503)
        assert resp.json()["service"] == "KEYSTONE"
