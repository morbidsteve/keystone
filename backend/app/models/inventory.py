"""Inventory tracking models — stock records and transactions."""

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
from sqlalchemy.sql import func

from app.database import Base


class TransactionType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    TURN_IN = "TURN_IN"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"
    LOSS = "LOSS"


class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    nsn = Column(String(20), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    unit_of_issue = Column(String(20), nullable=False, default="EA")
    quantity_on_hand = Column(Float, nullable=False, default=0.0)
    quantity_due_in = Column(Float, nullable=False, default=0.0)
    quantity_due_out = Column(Float, nullable=False, default=0.0)
    reorder_point = Column(Float, nullable=True)
    last_inventoried = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_record_id = Column(
        Integer,
        ForeignKey("inventory_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reference_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
