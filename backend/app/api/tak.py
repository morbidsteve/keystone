"""TAK (Team Awareness Kit) server management API endpoints."""

import ipaddress
import socket
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.ingestion.tak_connector import tak_connector
from app.ingestion.tak_parser import parse_cot_message
from app.models.tak_connection import ConnectionStatus, TAKConnection
from app.models.user import Role, User
from app.schemas.tak import (
    COTIngestRequest,
    COTIngestResponse,
    COTMessage,
    TAKConnectionCreate,
    TAKConnectionResponse,
    TAKConnectionStatus,
    TAKConnectionUpdate,
    TAKTestResult,
)

router = APIRouter()

# Private IP networks that should be blocked in production (SSRF protection)
_PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
]

# Cloud metadata endpoints that must always be blocked
_BLOCKED_HOSTS = {
    "metadata.google.internal",
    "metadata.google.com",
    "169.254.169.254",
}


def _validate_tak_host(host: str) -> None:
    """Validate that a TAK host is not a private/internal address.

    Blocks SSRF attacks by rejecting private IP ranges and cloud
    metadata endpoints. Controlled by ALLOW_PRIVATE_TAK_HOSTS setting.

    Raises:
        BadRequestError: If the host resolves to a blocked address.
    """
    # Always block cloud metadata endpoints
    if host.lower() in _BLOCKED_HOSTS:
        raise BadRequestError(f"Host '{host}' is a blocked cloud metadata endpoint.")

    # If private hosts are allowed (dev mode), skip further checks
    if settings.ALLOW_PRIVATE_TAK_HOSTS:
        return

    # Resolve hostname to IP and check against private ranges
    try:
        addr_infos = socket.getaddrinfo(host, None)
        for addr_info in addr_infos:
            ip = ipaddress.ip_address(addr_info[4][0])
            for network in _PRIVATE_NETWORKS:
                if ip in network:
                    raise BadRequestError(
                        f"Host '{host}' resolves to private IP {ip}. "
                        "Private TAK hosts are not allowed in production. "
                        "Set ALLOW_PRIVATE_TAK_HOSTS=true for development."
                    )
    except socket.gaierror:
        # Cannot resolve - let the connection attempt fail naturally
        pass


@router.get("/connections", response_model=List[TAKConnectionResponse])
async def list_tak_connections(
    is_active: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all configured TAK server connections."""
    query = select(TAKConnection)

    if is_active is not None:
        query = query.where(TAKConnection.is_active == is_active)

    query = query.order_by(TAKConnection.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    connections = result.scalars().all()

    return [TAKConnectionResponse.model_validate(conn) for conn in connections]


@router.post("/connections", response_model=TAKConnectionResponse)
async def create_tak_connection(
    data: TAKConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER, Role.S4])),
):
    """Create a new TAK server connection.

    Requires ADMIN, COMMANDER, or S4 role.
    """
    _validate_tak_host(data.host)

    connection = TAKConnection(
        name=data.name,
        host=data.host,
        port=data.port,
        protocol=data.protocol,
        api_port=data.api_port,
        use_tls=data.use_tls,
        verify_tls=data.verify_tls,
        cert_file=data.cert_file,
        api_token=data.api_token,
        unit_id=data.unit_id,
        cot_types_filter=data.cot_types_filter,
        channel_filter=data.channel_filter,
        is_active=data.is_active,
        connection_status=ConnectionStatus.DISCONNECTED,
        created_by=current_user.id,
    )

    db.add(connection)
    await db.flush()
    await db.refresh(connection)

    return TAKConnectionResponse.model_validate(connection)


@router.put("/connections/{connection_id}", response_model=TAKConnectionResponse)
async def update_tak_connection(
    connection_id: int,
    data: TAKConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER, Role.S4])),
):
    """Update an existing TAK server connection.

    Requires ADMIN, COMMANDER, or S4 role.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    update_data = data.model_dump(exclude_unset=True)

    # Validate host if it's being changed
    if "host" in update_data:
        _validate_tak_host(update_data["host"])

    for field, value in update_data.items():
        setattr(connection, field, value)

    await db.flush()
    await db.refresh(connection)

    return TAKConnectionResponse.model_validate(connection)


@router.delete("/connections/{connection_id}")
async def delete_tak_connection(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Delete a TAK server connection.

    Requires ADMIN role. Disconnects any active connection before deleting.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    # Disconnect if active
    await tak_connector.disconnect(connection_id)

    await db.delete(connection)
    await db.flush()

    return {
        "id": connection_id,
        "message": "TAK connection deleted",
    }


@router.post("/connections/{connection_id}/test", response_model=TAKTestResult)
async def test_tak_connection(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test connectivity to a TAK server.

    Attempts a connection to the configured TAK server and reports
    the result including latency and server version.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    test_result = await tak_connector.test_connection(connection)
    return TAKTestResult(**test_result)


@router.post("/connections/{connection_id}/start")
async def start_tak_polling(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER, Role.S4])),
):
    """Start polling a TAK server for CoT messages.

    Connects to the TAK server and enqueues a periodic polling task.
    Requires ADMIN, COMMANDER, or S4 role.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    if not connection.is_active:
        raise BadRequestError(
            "Cannot start polling on an inactive connection. "
            "Enable the connection first."
        )

    # Attempt to connect
    connected = await tak_connector.connect(connection)

    if connected:
        # Update connection status in DB
        connection.connection_status = ConnectionStatus.CONNECTED
        await db.flush()

        # Enqueue initial poll task
        try:
            from app.tasks.poll_tak import poll_tak_server

            poll_tak_server.delay(connection_id)
        except Exception:
            pass  # Celery may not be running in dev

        return {
            "connection_id": connection_id,
            "status": "connected",
            "message": f"Polling started for {connection.name}",
        }
    else:
        status = tak_connector.get_connection_status(connection_id)
        connection.connection_status = ConnectionStatus.ERROR
        connection.last_error = status.get("last_error", "Connection failed")
        await db.flush()

        raise BadRequestError(
            f"Failed to connect: {status.get('last_error', 'Unknown error')}"
        )


@router.post("/connections/{connection_id}/stop")
async def stop_tak_polling(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER, Role.S4])),
):
    """Stop polling a TAK server.

    Disconnects from the TAK server and stops the periodic polling task.
    Requires ADMIN, COMMANDER, or S4 role.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    await tak_connector.disconnect(connection_id)

    connection.connection_status = ConnectionStatus.DISCONNECTED
    await db.flush()

    return {
        "connection_id": connection_id,
        "status": "disconnected",
        "message": f"Polling stopped for {connection.name}",
    }


@router.get(
    "/connections/{connection_id}/status",
    response_model=TAKConnectionStatus,
)
async def get_tak_connection_status(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current status of a TAK connection.

    Returns connection state, message counts, last poll time, and any errors.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    runtime_status = tak_connector.get_connection_status(connection_id)

    return TAKConnectionStatus(
        connection_id=connection_id,
        name=connection.name,
        status=runtime_status.get("status", connection.connection_status.value),
        connected_at=runtime_status.get("connected_at"),
        last_poll=runtime_status.get("last_poll"),
        last_error=runtime_status.get("last_error") or connection.last_error,
        messages_received=runtime_status.get("messages_received", 0),
    )


@router.get("/connections/{connection_id}/messages")
async def get_tak_messages(
    connection_id: int,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent messages received from a TAK connection.

    Returns parsed CoT messages stored as raw data records from
    this TAK connection.
    """
    result = await db.execute(
        select(TAKConnection).where(TAKConnection.id == connection_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise NotFoundError("TAK Connection", connection_id)

    from app.models.raw_data import RawData

    # Query raw data records associated with this TAK connection
    messages_result = await db.execute(
        select(RawData)
        .where(
            RawData.file_name.like("tak_cot_%"),
            RawData.channel_name == connection.channel_filter
            if connection.channel_filter
            else True,
        )
        .order_by(RawData.ingested_at.desc())
        .limit(limit)
    )
    messages = messages_result.scalars().all()

    return [
        {
            "id": msg.id,
            "uid": msg.file_name.replace("tak_cot_", "") if msg.file_name else None,
            "callsign": msg.sender,
            "channel": msg.channel_name,
            "content_preview": (
                msg.original_content[:200] if msg.original_content else None
            ),
            "confidence": msg.confidence_score,
            "status": msg.parse_status.value,
            "received_at": (msg.ingested_at.isoformat() if msg.ingested_at else None),
        }
        for msg in messages
    ]


@router.post("/ingest/cot", response_model=COTIngestResponse)
async def ingest_cot_message(
    data: COTIngestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually submit a CoT XML message for parsing.

    Useful for testing CoT parsing without a live TAK server connection.
    Parses the XML and optionally stores the result.
    """
    parsed = parse_cot_message(data.xml_content)

    if parsed is None:
        return COTIngestResponse(
            success=False,
            message="Failed to parse CoT XML. Ensure valid CoT event format.",
            errors=["Invalid or malformed CoT XML"],
        )

    # Store as raw data for audit
    from app.models.raw_data import ParseStatus, RawData, SourceType

    raw = RawData(
        source_type=SourceType.MANUAL,
        original_content=data.xml_content,
        channel_name=parsed.get("group_name"),
        sender=parsed.get("callsign"),
        file_name=f"tak_cot_{parsed.get('uid', 'manual')}",
        parse_status=ParseStatus.PARSED,
        confidence_score=1.0,
        reviewed_by=current_user.id,
    )
    db.add(raw)
    await db.flush()

    # Build response
    cot_message = COTMessage(
        uid=parsed.get("uid", ""),
        cot_type=parsed.get("cot_type", ""),
        category=parsed.get("category", "UNKNOWN"),
        event_time=parsed.get("event_time"),
        start_time=parsed.get("start_time"),
        stale_time=parsed.get("stale_time"),
        how=parsed.get("how"),
        callsign=parsed.get("callsign"),
        group_name=parsed.get("group_name"),
        group_role=parsed.get("group_role"),
        remarks=parsed.get("remarks"),
    )

    # Add position if present
    if parsed.get("position"):
        from app.schemas.tak import COTPosition

        cot_message.position = COTPosition(**parsed["position"])

    return COTIngestResponse(
        success=True,
        message=f"CoT message parsed successfully. Category: {cot_message.category}",
        parsed=cot_message,
    )
