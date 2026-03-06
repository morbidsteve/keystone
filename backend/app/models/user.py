"""User model with role-based access control."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Role(str, enum.Enum):
    ADMIN = "admin"
    COMMANDER = "commander"
    S4 = "s4"
    S3 = "s3"
    OPERATOR = "operator"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(Role), nullable=False, default=Role.VIEWER)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    custom_role_id = Column(Integer, ForeignKey("custom_roles.id"), nullable=True)
    demo_profile = Column(JSON, nullable=True)

    unit = relationship("Unit", back_populates="users")
    custom_role = relationship(
        "CustomRole", back_populates="users", foreign_keys=[custom_role_id]
    )
