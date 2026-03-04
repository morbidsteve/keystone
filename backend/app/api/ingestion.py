"""Data ingestion endpoints for mIRC logs, Excel files, and route files."""

import logging
import zipfile
from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.ingestion.route_parser import (
    parse_geojson,
    parse_gpx,
    parse_kml,
    parse_kmz,
    parse_route_csv,
)
from app.models.location import Route, RouteStatus, RouteType
from app.models.raw_data import ParseStatus, RawData, SourceType
from app.models.user import Role, User
from app.utils.coordinates import latlon_to_mgrs

logger = logging.getLogger(__name__)

router = APIRouter()

# File size limits
_MAX_MIRC_SIZE = 10 * 1024 * 1024  # 10 MB
_MAX_EXCEL_SIZE = 50 * 1024 * 1024  # 50 MB
_MAX_ROUTE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/mirc")
async def upload_mirc_log(
    file: UploadFile = File(...),
    channel_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an mIRC log file for parsing."""
    if not file.filename:
        raise BadRequestError("No file provided")

    # Read with size limit to prevent memory exhaustion
    content = await file.read(_MAX_MIRC_SIZE + 1)
    if len(content) > _MAX_MIRC_SIZE:
        raise BadRequestError(
            f"mIRC log file exceeds maximum size of "
            f"{_MAX_MIRC_SIZE // (1024 * 1024)} MB."
        )

    text_content = content.decode("utf-8", errors="replace")

    raw = RawData(
        source_type=SourceType.MIRC,
        original_content=text_content,
        channel_name=channel_name,
        file_name=file.filename,
        parse_status=ParseStatus.PENDING,
        confidence_score=0.0,
    )
    db.add(raw)
    await db.flush()
    await db.refresh(raw)

    # Trigger Celery task
    try:
        from app.tasks.ingest_mirc import process_mirc_upload

        process_mirc_upload.delay(raw.id)
    except Exception:
        pass

    return {
        "id": raw.id,
        "file_name": file.filename,
        "status": raw.parse_status.value,
        "message": "File uploaded and queued for processing",
    }


@router.post("/excel")
async def upload_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an Excel file for parsing."""
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise BadRequestError("File must be an Excel file (.xlsx or .xls)")

    # Read with size limit to prevent memory exhaustion
    content = await file.read(_MAX_EXCEL_SIZE + 1)
    if len(content) > _MAX_EXCEL_SIZE:
        raise BadRequestError(
            f"Excel file exceeds maximum size of {_MAX_EXCEL_SIZE // (1024 * 1024)} MB."
        )

    raw = RawData(
        source_type=SourceType.EXCEL,
        original_content=f"[binary:{len(content)} bytes]",
        file_name=file.filename,
        parse_status=ParseStatus.PENDING,
        confidence_score=0.0,
    )
    db.add(raw)
    await db.flush()
    await db.refresh(raw)

    # Trigger Celery task
    try:
        from app.tasks.ingest_excel import process_excel_upload

        process_excel_upload.delay(raw.id, content)
    except Exception:
        pass

    return {
        "id": raw.id,
        "file_name": file.filename,
        "status": raw.parse_status.value,
        "message": "File uploaded and queued for processing",
    }


@router.get("/status")
async def list_ingestion_status(
    source_type: Optional[SourceType] = Query(None),
    parse_status: Optional[ParseStatus] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List raw data entries with their parse status."""
    query = select(RawData)

    if source_type:
        query = query.where(RawData.source_type == source_type)
    if parse_status:
        query = query.where(RawData.parse_status == parse_status)

    query = query.order_by(RawData.ingested_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()

    return [
        {
            "id": r.id,
            "source_type": r.source_type.value,
            "file_name": r.file_name,
            "channel_name": r.channel_name,
            "sender": r.sender,
            "parse_status": r.parse_status.value,
            "confidence_score": r.confidence_score,
            "ingested_at": r.ingested_at.isoformat() if r.ingested_at else None,
            "reviewed_by": r.reviewed_by,
        }
        for r in records
    ]


@router.get("/review-queue")
async def get_review_queue(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get items needing human review (confidence < 0.8)."""
    result = await db.execute(
        select(RawData)
        .where(
            RawData.parse_status == ParseStatus.PARSED,
            RawData.confidence_score < 0.8,
        )
        .order_by(RawData.confidence_score.asc())
        .limit(limit)
    )
    records = result.scalars().all()

    return [
        {
            "id": r.id,
            "source_type": r.source_type.value,
            "original_content": r.original_content[:500],
            "file_name": r.file_name,
            "channel_name": r.channel_name,
            "confidence_score": r.confidence_score,
            "parse_status": r.parse_status.value,
            "ingested_at": r.ingested_at.isoformat() if r.ingested_at else None,
        }
        for r in records
    ]


@router.put("/review/{record_id}")
async def review_record(
    record_id: int,
    approved: bool = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a parsed record after human review."""
    result = await db.execute(select(RawData).where(RawData.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Raw data record", record_id)

    if approved:
        record.parse_status = ParseStatus.REVIEWED
        record.confidence_score = 1.0
    else:
        record.parse_status = ParseStatus.FAILED
        record.confidence_score = 0.0

    record.reviewed_by = current_user.id
    await db.flush()

    return {
        "id": record.id,
        "parse_status": record.parse_status.value,
        "reviewed_by": current_user.id,
        "message": "Record approved" if approved else "Record rejected",
    }


# Map file extensions to parser functions
_ROUTE_PARSERS = {
    ".geojson": "geojson",
    ".json": "geojson",
    ".kml": "kml",
    ".kmz": "kmz",
    ".gpx": "gpx",
    ".csv": "csv",
}

_VALID_ROUTE_TYPES = {t.value for t in RouteType}


@router.post("/routes")
async def upload_route_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S3, Role.COMMANDER])),
):
    """Upload a route file (GeoJSON, KML, KMZ, GPX, CSV) for route creation.

    Requires ADMIN, S3, or COMMANDER role.
    """
    if not file.filename:
        raise BadRequestError("No file provided")

    # Determine format by file extension
    filename_lower = file.filename.lower()
    matched_format = None
    for ext, fmt in _ROUTE_PARSERS.items():
        if filename_lower.endswith(ext):
            matched_format = fmt
            break

    if matched_format is None:
        valid_exts = ", ".join(_ROUTE_PARSERS.keys())
        raise BadRequestError(
            f"Unsupported file format. Accepted extensions: {valid_exts}"
        )

    # Read with size limit
    content = await file.read(_MAX_ROUTE_SIZE + 1)
    if len(content) > _MAX_ROUTE_SIZE:
        raise BadRequestError(
            f"Route file exceeds maximum size of {_MAX_ROUTE_SIZE // (1024 * 1024)} MB."
        )

    # Create RawData tracking record
    raw = RawData(
        source_type=SourceType.ROUTE_FILE,
        original_content=f"[route_file:{len(content)} bytes]",
        file_name=file.filename,
        parse_status=ParseStatus.PENDING,
        confidence_score=0.0,
    )
    db.add(raw)
    await db.flush()
    await db.refresh(raw)

    # Parse the file based on format
    try:
        if matched_format == "geojson":
            parsed_routes = parse_geojson(content.decode("utf-8", errors="replace"))
        elif matched_format == "kml":
            parsed_routes = parse_kml(content)
        elif matched_format == "kmz":
            parsed_routes = parse_kmz(content)
        elif matched_format == "gpx":
            parsed_routes = parse_gpx(content)
        elif matched_format == "csv":
            parsed_routes = parse_route_csv(content.decode("utf-8", errors="replace"))
        else:
            raise BadRequestError(f"Unsupported format: {matched_format}")
    except (ValueError, zipfile.BadZipFile) as e:
        raw.parse_status = ParseStatus.FAILED
        await db.flush()
        raise BadRequestError(f"Failed to parse route file: {e}")
    except Exception:
        raw.parse_status = ParseStatus.FAILED
        await db.flush()
        logger.exception("Unexpected error parsing route file %s", file.filename)
        raise BadRequestError("Failed to parse route file: internal error")

    if not parsed_routes:
        raw.parse_status = ParseStatus.FAILED
        await db.flush()
        raise BadRequestError("No routes found in uploaded file")

    # Create Route records
    created_ids: list[int] = []
    for route_data in parsed_routes:
        # Determine route type from parsed data or default to SUPPLY_ROUTE
        route_type_str = route_data.get("route_type", "SUPPLY_ROUTE")
        if route_type_str not in _VALID_ROUTE_TYPES:
            route_type_str = "SUPPLY_ROUTE"

        # Normalize waypoints: add MGRS to each
        waypoints = []
        for wp in route_data.get("waypoints", []):
            lat = wp.get("lat")
            lon = wp.get("lon")
            if lat is None or lon is None:
                continue
            normalized_wp = {"lat": float(lat), "lon": float(lon)}
            try:
                mgrs_str = latlon_to_mgrs(float(lat), float(lon))
                normalized_wp["mgrs"] = mgrs_str
            except Exception:
                pass
            if wp.get("label"):
                normalized_wp["label"] = wp["label"]
            waypoints.append(normalized_wp)

        if not waypoints:
            continue

        route = Route(
            name=route_data.get("name", "Unnamed Route"),
            route_type=RouteType(route_type_str),
            status=RouteStatus.OPEN,
            waypoints=waypoints,
            description=route_data.get("description"),
            created_by_id=current_user.id,
        )
        db.add(route)
        await db.flush()
        await db.refresh(route)
        created_ids.append(route.id)

    # Update raw data status
    raw.parse_status = ParseStatus.PARSED
    raw.confidence_score = 1.0
    await db.flush()

    return {
        "raw_data_id": raw.id,
        "file_name": file.filename,
        "routes_created": len(created_ids),
        "route_ids": created_ids,
        "message": f"Successfully created {len(created_ids)} route(s) from {file.filename}",
    }
