"""Data source management API endpoints."""

import ipaddress
import logging
import os
import socket
import ssl
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import require_role
from app.database import get_db
from app.models.data_source import (
    DataSource,
    DataSourceStatus,
    DataSourceType,
    ProcessedFile,
)
from app.models.user import Role, User
from app.schemas.data_source import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceTestResult,
    DataSourceUpdate,
    ExcelDirectoryConfig,
    IRCServerConfig,
    MIRCDirectoryConfig,
    ProcessedFileResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# System directories that must never be watched
_BLOCKED_SYSTEM_DIRS = ["/etc", "/proc", "/sys", "/dev", "/boot", "/root"]

# Private IP networks that should be blocked for IRC SSRF protection
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


def _validate_irc_host(host: str) -> None:
    """Validate that an IRC host is not a private/internal address.

    Blocks SSRF attacks by rejecting cloud metadata endpoints and,
    unless ALLOW_PRIVATE_TAK_HOSTS is True, private IP ranges.

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
                        "Private IRC hosts are not allowed in production. "
                        "Set ALLOW_PRIVATE_TAK_HOSTS=true for development."
                    )
    except socket.gaierror:
        # Cannot resolve - let the connection attempt fail naturally
        pass


def _validate_directory_path(path: str) -> None:
    """Validate that a directory path is safe and within allowed directories.

    Blocks path traversal, system directories, and paths outside ALLOWED_DATA_DIRS.

    Raises:
        BadRequestError: If the path is invalid or not allowed.
    """
    if ".." in path:
        raise BadRequestError(
            "Directory path must not contain '..' (path traversal is not allowed)."
        )

    # Resolve symlinks to get the real path
    real_path = os.path.realpath(path)

    # Block system directories
    for sys_dir in _BLOCKED_SYSTEM_DIRS:
        if real_path == sys_dir or real_path.startswith(sys_dir + "/"):
            raise BadRequestError(
                f"Directory path '{path}' resolves to a blocked system directory."
            )

    # Check if path is within allowed data directories (fail-closed)
    allowed = settings.ALLOWED_DATA_DIRS
    if not allowed:
        raise BadRequestError(
            "No allowed data directories configured. Contact administrator."
        )

    in_allowed = False
    for allowed_dir in allowed:
        allowed_real = os.path.realpath(allowed_dir)
        if real_path == allowed_real or real_path.startswith(allowed_real + "/"):
            in_allowed = True
            break
    if not in_allowed:
        raise BadRequestError("Directory path is not within allowed data directories.")


def _validate_config(source_type: DataSourceType, config: dict) -> None:
    """Validate type-specific configuration using Pydantic sub-schemas.

    Also validates directory paths for directory-based source types.

    Raises:
        BadRequestError: If configuration is invalid.
    """
    try:
        if source_type == DataSourceType.MIRC_DIRECTORY:
            parsed = MIRCDirectoryConfig(**config)
            _validate_directory_path(parsed.directory_path)
        elif source_type == DataSourceType.IRC_SERVER:
            parsed = IRCServerConfig(**config)
            _validate_irc_host(parsed.host)
        elif source_type == DataSourceType.EXCEL_DIRECTORY:
            parsed = ExcelDirectoryConfig(**config)
            _validate_directory_path(parsed.directory_path)
        else:
            raise BadRequestError(f"Unknown source type: {source_type}")
    except BadRequestError:
        raise
    except Exception as exc:
        raise BadRequestError(f"Invalid configuration for {source_type.value}: {exc}")


@router.get("/", response_model=List[DataSourceResponse])
async def list_data_sources(
    source_type: Optional[DataSourceType] = Query(None),
    is_enabled: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all configured data sources with optional filters."""
    query = select(DataSource)

    if source_type is not None:
        query = query.where(DataSource.source_type == source_type)
    if is_enabled is not None:
        query = query.where(DataSource.is_enabled == is_enabled)

    query = query.order_by(DataSource.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    sources = result.scalars().all()

    return [DataSourceResponse.model_validate(s) for s in sources]


@router.post("/", response_model=DataSourceResponse)
async def create_data_source(
    data: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new data source configuration.

    Requires ADMIN role. Validates type-specific config and directory paths.
    """
    _validate_config(data.source_type, data.config)

    source = DataSource(
        name=data.name,
        source_type=data.source_type,
        is_enabled=data.is_enabled,
        config=data.config,
        status=DataSourceStatus.INACTIVE,
        created_by=current_user.id,
    )

    db.add(source)
    await db.flush()
    await db.refresh(source)

    return DataSourceResponse.model_validate(source)


@router.put("/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: int,
    data: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update an existing data source.

    Requires ADMIN role.
    """
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    update_data = data.model_dump(exclude_unset=True)

    # Determine the effective source_type and config for validation
    effective_type = update_data.get("source_type", source.source_type)
    effective_config = update_data.get("config", source.config)

    # Validate if config or source_type is changing
    if "config" in update_data or "source_type" in update_data:
        _validate_config(effective_type, effective_config)

    for field, value in update_data.items():
        setattr(source, field, value)

    await db.flush()
    await db.refresh(source)

    return DataSourceResponse.model_validate(source)


@router.delete("/{source_id}")
async def delete_data_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Delete a data source and all its processed file records.

    Requires ADMIN role.
    """
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    await db.delete(source)
    await db.flush()

    return {
        "id": source_id,
        "message": "Data source deleted",
    }


@router.post("/{source_id}/start")
async def start_data_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Enable a data source and trigger its ingestion task.

    Requires ADMIN role. For directory sources, enqueues a poll task.
    For IRC sources, enqueues a connection task.
    """
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    source.is_enabled = True
    source.status = DataSourceStatus.ACTIVE
    source.last_error = None
    await db.flush()
    await db.refresh(source)

    # Trigger the appropriate Celery task
    try:
        if source.source_type in (
            DataSourceType.MIRC_DIRECTORY,
            DataSourceType.EXCEL_DIRECTORY,
        ):
            from app.tasks.poll_directory import poll_directory_source

            poll_directory_source.delay(source_id)
        elif source.source_type == DataSourceType.IRC_SERVER:
            from app.tasks.connect_irc import connect_irc_source

            connect_irc_source.delay(source_id)
    except Exception:
        pass  # Celery may not be running in dev

    return {
        "id": source_id,
        "status": "active",
        "message": f"Data source '{source.name}' started",
    }


@router.post("/{source_id}/stop")
async def stop_data_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Disable a data source and set its status to inactive.

    Requires ADMIN role.
    """
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    source.is_enabled = False
    source.status = DataSourceStatus.INACTIVE
    await db.flush()
    await db.refresh(source)

    return {
        "id": source_id,
        "status": "inactive",
        "message": f"Data source '{source.name}' stopped",
    }


@router.post("/{source_id}/test", response_model=DataSourceTestResult)
async def test_data_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Test a data source configuration.

    For directory sources, verifies the directory exists and is readable.
    For IRC sources, tests TCP connectivity to the server.
    Requires ADMIN role.
    """
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    config = source.config or {}

    if source.source_type in (
        DataSourceType.MIRC_DIRECTORY,
        DataSourceType.EXCEL_DIRECTORY,
    ):
        directory_path = config.get("directory_path", "")
        if not directory_path:
            return DataSourceTestResult(
                success=False,
                message="No directory_path configured.",
            )
        try:
            _validate_directory_path(directory_path)
        except BadRequestError as exc:
            return DataSourceTestResult(
                success=False,
                message=str(exc.detail),
            )
        if not os.path.isdir(directory_path):
            return DataSourceTestResult(
                success=False,
                message=f"Directory does not exist: {directory_path}",
            )
        if not os.access(directory_path, os.R_OK):
            return DataSourceTestResult(
                success=False,
                message=f"Directory is not readable: {directory_path}",
            )
        return DataSourceTestResult(
            success=True,
            message=f"Directory exists and is readable: {directory_path}",
        )

    elif source.source_type == DataSourceType.IRC_SERVER:
        host = config.get("host", "")
        port = config.get("port", 6667)
        use_ssl = config.get("use_ssl", True)
        if not host:
            return DataSourceTestResult(
                success=False,
                message="No host configured.",
            )
        try:
            _validate_irc_host(host)
        except BadRequestError as exc:
            return DataSourceTestResult(
                success=False,
                message=str(exc.detail),
            )
        try:
            sock = socket.create_connection((host, port), timeout=10)
            if use_ssl:
                context = ssl.create_default_context()
                sock = context.wrap_socket(sock, server_hostname=host)
            sock.close()
            return DataSourceTestResult(
                success=True,
                message="IRC connection test successful.",
            )
        except Exception as exc:
            logger.warning(f"IRC test failed: {host}:{port}: {exc}")
            return DataSourceTestResult(
                success=False,
                message="IRC connection test failed.",
            )

    return DataSourceTestResult(
        success=False,
        message=f"Test not implemented for source type: {source.source_type.value}",
    )


@router.get("/{source_id}/processed-files", response_model=List[ProcessedFileResponse])
async def list_processed_files(
    source_id: int,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List files processed by a specific data source."""
    # Verify the source exists
    source_result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = source_result.scalar_one_or_none()
    if not source:
        raise NotFoundError("DataSource", source_id)

    query = (
        select(ProcessedFile)
        .where(ProcessedFile.data_source_id == source_id)
        .order_by(ProcessedFile.processed_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    files = result.scalars().all()

    return [ProcessedFileResponse.model_validate(f) for f in files]
