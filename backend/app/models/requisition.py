"""Requisition workflow models — requisitions, line items, approvals, and status history."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RequisitionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    SOURCING = "SOURCING"
    BACKORDERED = "BACKORDERED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    CANCELED = "CANCELED"


class ApprovalAction(str, enum.Enum):
    APPROVE = "APPROVE"
    DENY = "DENY"
    RETURN = "RETURN"


class RequisitionPriority(str, enum.Enum):
    P01 = "01"
    P02 = "02"
    P03 = "03"
    P04 = "04"
    P05 = "05"
    P06 = "06"
    P07 = "07"
    P08 = "08"
    P09 = "09"
    P10 = "10"
    P11 = "11"
    P12 = "12"
    P13 = "13"
    P14 = "14"
    P15 = "15"


class ConditionCode(str, enum.Enum):
    A = "A"  # Serviceable
    B = "B"  # Serviceable with qualification
    F = "F"  # Unserviceable (repairable)
    H = "H"  # Unserviceable (condemned)


class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(Integer, primary_key=True, index=True)
    requisition_number = Column(String(50), unique=True, nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        SQLEnum(RequisitionStatus),
        nullable=False,
        default=RequisitionStatus.DRAFT,
    )
    priority = Column(
        SQLEnum(RequisitionPriority),
        nullable=False,
        default=RequisitionPriority.P08,
    )
    justification = Column(Text, nullable=True)
    delivery_location = Column(String(200), nullable=True)
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    cancel_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    line_items = relationship(
        "RequisitionLineItem",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )
    approvals = relationship(
        "RequisitionApproval",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )
    status_history = relationship(
        "RequisitionStatusHistory",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )


class RequisitionLineItem(Base):
    __tablename__ = "requisition_line_items"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(
        Integer,
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nsn = Column(String(20), nullable=True)
    nomenclature = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_of_issue = Column(String(20), nullable=False, default="EA")
    unit_cost = Column(Float, nullable=True)
    condition_code = Column(
        SQLEnum(ConditionCode), nullable=True, default=ConditionCode.A
    )
    notes = Column(Text, nullable=True)

    requisition = relationship("Requisition", back_populates="line_items")


class RequisitionApproval(Base):
    __tablename__ = "requisition_approvals"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(
        Integer,
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(SQLEnum(ApprovalAction), nullable=False)
    comments = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="approvals")


class RequisitionStatusHistory(Base):
    __tablename__ = "requisition_status_history"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(
        Integer,
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status = Column(SQLEnum(RequisitionStatus), nullable=True)
    to_status = Column(SQLEnum(RequisitionStatus), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="status_history")
