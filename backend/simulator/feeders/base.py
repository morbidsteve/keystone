"""Base HTTP client for simulator feeders."""

import asyncio
import logging
from typing import Optional

import httpx

logger = logging.getLogger("simulator.feeders")


class SimulatorClient:
    """Async HTTP client that authenticates against KEYSTONE and pushes data.

    Usage::

        async with SimulatorClient("http://localhost:8000") as client:
            await client.authenticate("simulator", os.environ["SIM_PASSWORD"])
            await client.post_tak_cot("<event .../>")
    """

    def __init__(self, base_url: str = "http://localhost:8000", api_delay_ms: int = 200) -> None:
        self.base_url = base_url.rstrip("/")
        self.token: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None
        self._username: Optional[str] = None
        self._password: Optional[str] = None
        self._api_delay_ms: int = api_delay_ms
        self._last_request_time: Optional[float] = None

    async def __aenter__(self) -> "SimulatorClient":
        self._client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, *args: object) -> None:
        if self._client:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Rate limiting
    # ------------------------------------------------------------------

    async def _rate_limit(self) -> None:
        """Enforce minimum delay between API calls."""
        if self._last_request_time is not None:
            elapsed = (asyncio.get_event_loop().time() - self._last_request_time) * 1000
            if elapsed < self._api_delay_ms:
                await asyncio.sleep((self._api_delay_ms - elapsed) / 1000)
        self._last_request_time = asyncio.get_event_loop().time()

    # ------------------------------------------------------------------
    # Request helper with 401 retry
    # ------------------------------------------------------------------

    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Make request, retry once with re-auth on 401."""
        if self._client is None:
            raise RuntimeError("SimulatorClient not initialized. Use 'async with' context manager.")
        await self._rate_limit()
        resp = await self._client.request(method, url, **kwargs)
        if resp.status_code == 401 and self._username and self._password:
            logger.info("Token expired, re-authenticating...")
            await self.authenticate(self._username, self._password)
            kwargs["headers"] = self.auth_headers
            resp = await self._client.request(method, url, **kwargs)
        return resp

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    async def authenticate(self, username: str, password: str) -> None:
        """Login and store JWT token."""
        if self._client is None:
            raise RuntimeError("SimulatorClient not initialized. Use 'async with' context manager.")
        self._username = username
        self._password = password
        resp = await self._client.post(
            f"{self.base_url}/api/v1/auth/login",
            json={"username": username, "password": password},
        )
        resp.raise_for_status()
        data = resp.json()
        self.token = data["token"]
        logger.info("Authenticated as %s", username)

    @property
    def auth_headers(self) -> dict[str, str]:
        """Return Authorization header dict (empty if not yet authenticated)."""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    # ------------------------------------------------------------------
    # Ingestion endpoints
    # ------------------------------------------------------------------

    async def post_mirc_log(
        self, content: str, channel: str, filename: str
    ) -> dict:
        """Upload mIRC log file through the ingestion pipeline."""
        resp = await self._request_with_retry(
            "POST",
            f"{self.base_url}/api/v1/ingestion/mirc",
            files={"file": (filename, content.encode("utf-8"), "text/plain")},
            params={"channel_name": channel},
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def post_excel(self, content: bytes, filename: str) -> dict:
        """Upload Excel file through the ingestion pipeline."""
        resp = await self._request_with_retry(
            "POST",
            f"{self.base_url}/api/v1/ingestion/excel",
            files={
                "file": (
                    filename,
                    content,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def post_tak_cot(self, xml_content: str) -> dict:
        """Submit CoT message through TAK ingestion pipeline."""
        resp = await self._request_with_retry(
            "POST",
            f"{self.base_url}/api/v1/tak/ingest/cot",
            json={"xml_content": xml_content},
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # Direct CRUD endpoints (supply / equipment / transportation)
    # ------------------------------------------------------------------

    async def post_supply(self, payload: dict) -> dict:
        """Create a supply status record via POST /api/v1/supply/."""
        return await self.post_json("/api/v1/supply/", payload)

    async def post_equipment(self, payload: dict) -> dict:
        """Create an equipment status record via POST /api/v1/equipment/."""
        return await self.post_json("/api/v1/equipment/", payload)

    async def post_transportation(self, payload: dict) -> dict:
        """Create a transportation movement via POST /api/v1/transportation/."""
        return await self.post_json("/api/v1/transportation/", payload)

    # ------------------------------------------------------------------
    # Generic helpers
    # ------------------------------------------------------------------

    async def post_json(self, endpoint: str, payload: dict) -> dict:
        """POST JSON to any endpoint (for manual-entry feeder)."""
        resp = await self._request_with_retry(
            "POST",
            f"{self.base_url}{endpoint}",
            json=payload,
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def put_json(self, endpoint: str, payload: dict) -> dict:
        """PUT JSON to any endpoint (for record updates)."""
        resp = await self._request_with_retry(
            "PUT",
            f"{self.base_url}{endpoint}",
            json=payload,
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def get_json(self, endpoint: str, params: Optional[dict] = None) -> dict:
        """GET JSON from any endpoint."""
        resp = await self._request_with_retry(
            "GET",
            f"{self.base_url}{endpoint}",
            params=params,
            headers=self.auth_headers,
        )
        resp.raise_for_status()
        return resp.json()
