"""Service layer for Audit Chain of Custody & Accountability."""

import json
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.custody import (
    AuditAction,
    AuditEntityType,
    AuditLog,
    SensitiveItem,
)


class CustodyService:
    """Service for sensitive item custody operations."""

    @staticmethod
    async def get_unit_sensitive_items(
        db: AsyncSession,
        unit_id: int,
    ) -> List[SensitiveItem]:
        """Get all sensitive items for a unit."""
        result = await db.execute(
            select(SensitiveItem)
            .where(SensitiveItem.unit_id == unit_id)
            .order_by(SensitiveItem.nomenclature)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_items_by_holder(
        db: AsyncSession,
        personnel_id: int,
    ) -> List[SensitiveItem]:
        """Get all sensitive items held by a specific person."""
        result = await db.execute(
            select(SensitiveItem)
            .where(SensitiveItem.current_holder_id == personnel_id)
            .order_by(SensitiveItem.nomenclature)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_custody_chain(
        db: AsyncSession,
        sensitive_item_id: int,
    ) -> dict:
        """Get full custody chain for a sensitive item."""
        result = await db.execute(
            select(SensitiveItem)
            .where(SensitiveItem.id == sensitive_item_id)
            .options(selectinload(SensitiveItem.transfers))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError("SensitiveItem", sensitive_item_id)

        return {"item": item, "transfers": list(item.transfers)}

    @staticmethod
    async def generate_hand_receipt(
        db: AsyncSession,
        personnel_id: int,
    ) -> dict:
        """Generate hand receipt data for a person."""
        items = await CustodyService.get_items_by_holder(db, personnel_id)
        return {
            "personnel_id": personnel_id,
            "items": items,
            "total_items": len(items),
        }


class AuditService:
    """Service for audit log operations."""

    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: int,
        action: AuditAction,
        entity_type: AuditEntityType,
        description: str,
        entity_id: Optional[int] = None,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_value=json.dumps(old_value) if old_value is not None else None,
            new_value=json.dumps(new_value) if new_value is not None else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def get_audit_trail(
        db: AsyncSession,
        entity_type: Optional[AuditEntityType] = None,
        entity_id: Optional[int] = None,
        days_back: int = 30,
    ) -> List[AuditLog]:
        """Get audit trail with optional filters."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        query = select(AuditLog).where(AuditLog.created_at >= cutoff)

        if entity_type is not None:
            query = query.where(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            query = query.where(AuditLog.entity_id == entity_id)

        query = query.order_by(AuditLog.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_user_activity(
        db: AsyncSession,
        user_id: int,
        days_back: int = 30,
    ) -> List[AuditLog]:
        """Get all audit entries for a specific user."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id, AuditLog.created_at >= cutoff)
            .order_by(AuditLog.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_sensitive_actions(
        db: AsyncSession,
        hours_back: int = 24,
    ) -> List[AuditLog]:
        """Get high-sensitivity actions within a time window."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        sensitive_actions = [
            AuditAction.DELETE,
            AuditAction.PERMISSION_CHANGE,
            AuditAction.STATUS_CHANGE,
            AuditAction.TRANSFER,
            AuditAction.EXPORT,
        ]
        result = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.created_at >= cutoff,
                AuditLog.action.in_(sensitive_actions),
            )
            .order_by(AuditLog.created_at.desc())
        )
        return list(result.scalars().all())
