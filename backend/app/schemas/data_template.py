"""Pydantic schemas for data template and schema mapping endpoints."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Field Mapping ---

class FieldMapping(BaseModel):
    """A single source-to-target column mapping."""
    source_column: str = Field(..., description="Column name in the source data")
    target_entity: str = Field(..., description="Target canonical entity (e.g. supply_status)")
    target_field: str = Field(..., description="Target canonical field (e.g. on_hand_qty)")
    transform_type: Optional[str] = Field(
        None,
        description="Transform to apply: string, integer, float, datetime, regex, enum",
    )
    transform_params: Optional[Dict[str, Any]] = Field(
        None,
        description="Extra params for transform (e.g. date format, regex pattern)",
    )


# --- Canonical Field ---

class CanonicalFieldResponse(BaseModel):
    id: int
    entity_name: str
    field_name: str
    display_name: str
    data_type: str
    is_required: bool
    enum_values: Optional[List[str]] = None
    description: Optional[str] = None
    entity_group: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CanonicalFieldGrouped(BaseModel):
    """Canonical fields grouped by entity for the UI."""
    entity_name: str
    entity_group: Optional[str] = None
    fields: List[CanonicalFieldResponse]


# --- Data Template ---

class DataTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    source_type: str = Field(..., pattern=r"^(EXCEL|CSV|MIRC|TAK|CUSTOM)$")
    field_mappings: Dict[str, Dict[str, Any]] = Field(
        ...,
        description=(
            "Maps source column names to target info. "
            'Format: {"Col Name": {"target_entity": "...", "target_field": "...", "transform": "..."}}'
        ),
    )
    header_patterns: Optional[List[str]] = Field(
        None, description="Known header values for auto-detection"
    )


class DataTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    source_type: Optional[str] = Field(None, pattern=r"^(EXCEL|CSV|MIRC|TAK|CUSTOM)$")
    field_mappings: Optional[Dict[str, Dict[str, Any]]] = None
    header_patterns: Optional[List[str]] = None
    is_active: Optional[bool] = None


class DataTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    source_type: str
    field_mappings: Dict[str, Dict[str, Any]]
    header_patterns: Optional[List[str]] = None
    version: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DataTemplateListItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    source_type: str
    field_count: int
    version: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime


# --- Preview ---

class MappingPreviewRequest(BaseModel):
    """Request to preview how data would be mapped."""
    field_mappings: Dict[str, Dict[str, Any]]
    sample_data: List[Dict[str, Any]] = Field(
        ..., description="List of row dicts from the uploaded file"
    )


class MappingPreviewRow(BaseModel):
    """A single row of mapped output."""
    source: Dict[str, Any]
    mapped: Dict[str, Any]
    errors: List[str] = Field(default_factory=list)


class MappingPreviewResponse(BaseModel):
    """Preview response with mapped output rows."""
    rows: List[MappingPreviewRow]
    total_rows: int
    successful_rows: int
    error_count: int


# --- Auto-Detect ---

class AutoDetectRequest(BaseModel):
    """Request body for auto-detect (headers extracted from uploaded file)."""
    headers: List[str]
    sample_rows: Optional[List[Dict[str, Any]]] = None


class AutoDetectResponse(BaseModel):
    """Result of auto-detection."""
    matched: bool
    template: Optional[DataTemplateResponse] = None
    confidence: float = 0.0
    message: str
