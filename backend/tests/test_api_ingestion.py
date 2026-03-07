"""Tests for data ingestion API endpoints."""

import io

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.raw_data import ParseStatus, RawData, SourceType
from app.models.user import User


@pytest.mark.asyncio
class TestMIRCIngestion:
    """Tests for /api/v1/ingestion/mirc upload endpoint."""

    async def test_upload_mirc_log(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """POST /api/v1/ingestion/mirc uploads a text file."""
        content = b"[12:00] <ALPHA> Supply status: Class I GREEN, DOS 7\n"
        resp = await client.post(
            "/api/v1/ingestion/mirc",
            files={"file": ("test_log.txt", io.BytesIO(content), "text/plain")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert data["status"] == "PENDING"
        assert data["file_name"] == "test_log.txt"

    async def test_upload_mirc_unauthenticated(self, client: AsyncClient):
        """POST /api/v1/ingestion/mirc without token returns 401/403."""
        content = b"[12:00] <USER> Test\n"
        resp = await client.post(
            "/api/v1/ingestion/mirc",
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        )
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestExcelIngestion:
    """Tests for /api/v1/ingestion/excel upload endpoint."""

    async def test_upload_non_excel_rejected(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """POST /api/v1/ingestion/excel with non-Excel file returns 400."""
        content = b"not an excel file"
        resp = await client.post(
            "/api/v1/ingestion/excel",
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 400

    async def test_upload_excel_by_extension(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """POST /api/v1/ingestion/excel with .xlsx extension is accepted."""
        # Minimal content; the actual parsing happens in Celery
        content = b"PK\x03\x04"  # ZIP magic bytes (xlsx is a ZIP)
        resp = await client.post(
            "/api/v1/ingestion/excel",
            files={
                "file": (
                    "data.xlsx",
                    io.BytesIO(content),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["file_name"] == "data.xlsx"


@pytest.mark.asyncio
class TestIngestionStatus:
    """Tests for /api/v1/ingestion/status endpoint."""

    async def test_list_ingestion_status(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/ingestion/status returns 200."""
        resp = await client.get(
            "/api/v1/ingestion/status",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_ingestion_status_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/ingestion/status without token returns 401/403."""
        resp = await client.get("/api/v1/ingestion/status")
        assert resp.status_code in (401, 403)

    async def test_list_with_source_type_filter(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """GET /api/v1/ingestion/status?source_type=MIRC filters correctly."""
        raw = RawData(
            source_type=SourceType.MIRC,
            original_content="test content",
            file_name="filtered.txt",
            parse_status=ParseStatus.PENDING,
            confidence_score=0.0,
        )
        db_session.add(raw)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/ingestion/status?source_type=MIRC",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert all(r["source_type"] == "MIRC" for r in data)


@pytest.mark.asyncio
class TestReviewQueue:
    """Tests for /api/v1/ingestion/review-queue and /review/{id} endpoints."""

    async def test_get_review_queue(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/ingestion/review-queue returns 200."""
        resp = await client.get(
            "/api/v1/ingestion/review-queue",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_review_record_approve(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """PUT /api/v1/ingestion/review/{id}?approved=true approves the record."""
        raw = RawData(
            source_type=SourceType.MIRC,
            original_content="review me",
            file_name="review.txt",
            parse_status=ParseStatus.PARSED,
            confidence_score=0.5,
        )
        db_session.add(raw)
        await db_session.flush()
        await db_session.refresh(raw)

        resp = await client.put(
            f"/api/v1/ingestion/review/{raw.id}?approved=true",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["parse_status"] == "REVIEWED"
        assert "approved" in data["message"].lower()

    async def test_review_record_reject(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """PUT /api/v1/ingestion/review/{id}?approved=false rejects the record."""
        raw = RawData(
            source_type=SourceType.MIRC,
            original_content="reject me",
            file_name="reject.txt",
            parse_status=ParseStatus.PARSED,
            confidence_score=0.3,
        )
        db_session.add(raw)
        await db_session.flush()
        await db_session.refresh(raw)

        resp = await client.put(
            f"/api/v1/ingestion/review/{raw.id}?approved=false",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["parse_status"] == "FAILED"

    async def test_review_record_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """PUT /api/v1/ingestion/review/99999 returns 404."""
        resp = await client.put(
            "/api/v1/ingestion/review/99999?approved=true",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestRouteIngestion:
    """Tests for /api/v1/ingestion/routes endpoint."""

    async def test_upload_unsupported_format(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """POST /api/v1/ingestion/routes with unsupported format returns 400."""
        content = b"not a route file"
        resp = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": ("route.docx", io.BytesIO(content), "application/octet-stream")
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 400

    async def test_upload_route_operator_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        operator_user: User,
    ):
        """POST /api/v1/ingestion/routes as OPERATOR returns 403."""
        content = b'{"type":"FeatureCollection","features":[]}'
        resp = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("route.geojson", io.BytesIO(content), "application/json")},
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert resp.status_code == 403
