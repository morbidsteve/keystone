"""Pydantic schemas for granular RBAC."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class PermissionResponse(BaseModel):
    id: int
    code: str
    display_name: str
    category: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CustomRoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: List[int]


class CustomRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class CustomRoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPermissionsResponse(BaseModel):
    role_name: str
    permissions: List[str]


class AssignRoleRequest(BaseModel):
    custom_role_id: int
