"""Authentication and user schemas."""

import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import Role


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    token: str
    user: "UserResponse"


class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: Role = Role.VIEWER
    unit_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=12)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """Enforce password complexity requirements.

        Must contain at least one uppercase letter, one lowercase letter,
        and one digit.
        """
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[Role] = None
    unit_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    permissions: List[str] = []

    model_config = ConfigDict(from_attributes=True)
