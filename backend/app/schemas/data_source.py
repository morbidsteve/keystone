"""Pydantic schemas for data source configuration and management."""

import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.data_source import DataSourceStatus, DataSourceType

# RFC 2812 compliant IRC nickname pattern
_IRC_NICK_PATTERN = re.compile(r"^[a-zA-Z][a-zA-Z0-9_\-\[\]\\^{}|]{0,28}$")

# Simple IRC channel name pattern
_IRC_CHANNEL_PATTERN = re.compile(r"^#[a-zA-Z0-9_\-]{1,49}$")


# --- Type-specific config schemas ---


def _validate_file_pattern(v: str) -> str:
    """Validate that a file_pattern does not contain directory traversal."""
    if "/" in v or "\\" in v:
        raise ValueError("file_pattern must not contain path separators ('/' or '\\').")
    if ".." in v:
        raise ValueError(
            "file_pattern must not contain '..' (path traversal is not allowed)."
        )
    return v


class MIRCDirectoryConfig(BaseModel):
    """Configuration for mIRC log directory watcher."""

    directory_path: str = Field(..., min_length=1, max_length=500)
    file_pattern: str = Field(default="*.log", max_length=100)
    poll_interval_seconds: int = Field(default=60, ge=10, le=86400)

    @field_validator("file_pattern")
    @classmethod
    def validate_file_pattern(cls, v: str) -> str:
        return _validate_file_pattern(v)


class IRCServerConfig(BaseModel):
    """Configuration for an IRC server connection."""

    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=6667, ge=1, le=65535)
    use_ssl: bool = True
    nick: str = Field(..., min_length=1, max_length=30)
    channels: List[str] = Field(..., min_length=1)
    buffer_seconds: int = Field(default=30, ge=5, le=600)

    @field_validator("nick")
    @classmethod
    def validate_nick(cls, v: str) -> str:
        """Validate IRC nick against RFC 2812 and reject control characters."""
        if "\r" in v or "\n" in v or "\x00" in v:
            raise ValueError(
                "IRC nick must not contain control characters (CR, LF, NUL)."
            )
        if not _IRC_NICK_PATTERN.match(v):
            raise ValueError(
                "IRC nick must start with a letter and contain only "
                "alphanumeric characters, hyphens, underscores, and "
                "brackets (max 29 characters)."
            )
        return v

    @field_validator("channels")
    @classmethod
    def validate_channels(cls, v: List[str]) -> List[str]:
        """Validate IRC channel names and reject control characters."""
        for channel in v:
            if "\r" in channel or "\n" in channel or "\x00" in channel:
                raise ValueError(
                    f"IRC channel '{channel}' must not contain control "
                    "characters (CR, LF, NUL)."
                )
            if not _IRC_CHANNEL_PATTERN.match(channel):
                raise ValueError(
                    f"IRC channel '{channel}' must start with '#' followed "
                    "by 1-49 alphanumeric characters, hyphens, or "
                    "underscores."
                )
        return v


class ExcelDirectoryConfig(BaseModel):
    """Configuration for Excel file directory watcher."""

    directory_path: str = Field(..., min_length=1, max_length=500)
    file_pattern: str = Field(default="*.xlsx", max_length=100)
    poll_interval_seconds: int = Field(default=120, ge=10, le=86400)
    template_id: Optional[int] = None

    @field_validator("file_pattern")
    @classmethod
    def validate_file_pattern(cls, v: str) -> str:
        return _validate_file_pattern(v)


# --- Data Source CRUD schemas ---


class DataSourceBase(BaseModel):
    """Base schema for data source fields."""

    name: str = Field(..., min_length=1, max_length=100)
    source_type: DataSourceType
    config: Dict[str, Any] = Field(default_factory=dict)
    is_enabled: bool = True


class DataSourceCreate(DataSourceBase):
    """Schema for creating a new data source."""

    pass


class DataSourceUpdate(BaseModel):
    """Schema for updating an existing data source. All fields optional."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    source_type: Optional[DataSourceType] = None
    config: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


class DataSourceResponse(BaseModel):
    """Schema for data source API response."""

    id: int
    name: str
    source_type: DataSourceType
    is_enabled: bool
    config: Dict[str, Any]
    status: DataSourceStatus
    last_run: Optional[datetime] = None
    last_error: Optional[str] = None
    files_processed: int = 0
    records_ingested: int = 0
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProcessedFileResponse(BaseModel):
    """Schema for processed file API response."""

    id: int
    data_source_id: int
    file_path: str
    file_hash: Optional[str] = None
    records_extracted: int = 0
    processed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DataSourceTestResult(BaseModel):
    """Result from testing a data source configuration."""

    success: bool
    message: str
