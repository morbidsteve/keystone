"""Maintenance analytics service — database-agnostic calculations."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import Equipment, EquipmentAssetStatus, EquipmentFault
from app.models.maintenance import (
    MaintenanceLabor,
    MaintenancePart,
    MaintenanceWorkOrder,
    PartSource,
    PartStatus,
    WorkOrderStatus,
)
from app.models.maintenance_schedule import (
    MaintenanceDeadline,
    PreventiveMaintenanceSchedule,
)


class MaintenanceAnalytics:
    """Calculate maintenance analytics for a unit using database-agnostic queries."""

    def __init__(self, db: AsyncSession, unit_id: int):
        self.db = db
        self.unit_id = unit_id

    async def calculate_deadline_rate(self) -> dict:
        """Calculate percentage of equipment currently deadlined.

        Uses the Equipment model's status field (EquipmentAssetStatus.DEADLINED).
        """
        total_result = await self.db.execute(
            select(func.count(Equipment.id)).where(
                Equipment.unit_id == self.unit_id
            )
        )
        total_count = total_result.scalar() or 0

        if total_count == 0:
            return {
                "total_equipment": 0,
                "deadlined_count": 0,
                "deadline_rate_pct": 0.0,
            }

        deadlined_result = await self.db.execute(
            select(func.count(Equipment.id)).where(
                Equipment.unit_id == self.unit_id,
                Equipment.status == EquipmentAssetStatus.DEADLINED,
            )
        )
        deadlined_count = deadlined_result.scalar() or 0

        rate = round(deadlined_count / total_count * 100, 1)
        return {
            "total_equipment": total_count,
            "deadlined_count": deadlined_count,
            "deadline_rate_pct": rate,
        }

    async def calculate_avg_repair_time(self, days: int = 90) -> dict:
        """Calculate average repair time using Python datetime math.

        Fetches completed work orders within the window and computes
        mean turnaround from created_at to completed_at.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        result = await self.db.execute(
            select(MaintenanceWorkOrder).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.status == WorkOrderStatus.COMPLETE,
                MaintenanceWorkOrder.completed_at.isnot(None),
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        completed_orders = result.scalars().all()

        if not completed_orders:
            return {
                "completed_work_orders": 0,
                "avg_repair_hours": 0.0,
                "period_days": days,
            }

        total_hours = 0.0
        valid_count = 0
        for wo in completed_orders:
            if wo.completed_at and wo.created_at:
                delta = wo.completed_at - wo.created_at
                total_hours += delta.total_seconds() / 3600
                valid_count += 1

        avg_hours = round(total_hours / valid_count, 1) if valid_count > 0 else 0.0

        return {
            "completed_work_orders": valid_count,
            "avg_repair_hours": avg_hours,
            "period_days": days,
        }

    async def calculate_parts_fill_rate(self, days: int = 90) -> dict:
        """Calculate parts fill rate — received/installed vs total parts requested."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        # Get work order IDs in the window
        wo_result = await self.db.execute(
            select(MaintenanceWorkOrder.id).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        wo_ids = [row[0] for row in wo_result.all()]

        if not wo_ids:
            return {
                "total_parts_requested": 0,
                "parts_filled": 0,
                "fill_rate_pct": 0.0,
                "period_days": days,
            }

        total_result = await self.db.execute(
            select(func.count(MaintenancePart.id)).where(
                MaintenancePart.work_order_id.in_(wo_ids)
            )
        )
        total_parts = total_result.scalar() or 0

        filled_result = await self.db.execute(
            select(func.count(MaintenancePart.id)).where(
                MaintenancePart.work_order_id.in_(wo_ids),
                MaintenancePart.status.in_(
                    [PartStatus.RECEIVED, PartStatus.INSTALLED]
                ),
            )
        )
        filled_parts = filled_result.scalar() or 0

        fill_rate = round(filled_parts / total_parts * 100, 1) if total_parts > 0 else 0.0

        return {
            "total_parts_requested": total_parts,
            "parts_filled": filled_parts,
            "fill_rate_pct": fill_rate,
            "period_days": days,
        }

    async def get_overdue_pms(self) -> dict:
        """Get preventive maintenance schedules where next_due is past."""
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(PreventiveMaintenanceSchedule).where(
                PreventiveMaintenanceSchedule.unit_id == self.unit_id,
                PreventiveMaintenanceSchedule.next_due < now,
            )
        )
        overdue = result.scalars().all()

        return {
            "overdue_count": len(overdue),
            "overdue_pms": [
                {
                    "id": pm.id,
                    "equipment_id": pm.equipment_id,
                    "pm_type": pm.pm_type.value if pm.pm_type else None,
                    "next_due": pm.next_due.isoformat() if pm.next_due else None,
                }
                for pm in overdue
            ],
        }

    async def get_deadline_equipment(self) -> dict:
        """Get active deadlines where lifted_date IS NULL."""
        result = await self.db.execute(
            select(MaintenanceDeadline).where(
                MaintenanceDeadline.unit_id == self.unit_id,
                MaintenanceDeadline.lifted_date.is_(None),
            )
        )
        active_deadlines = result.scalars().all()

        return {
            "active_deadline_count": len(active_deadlines),
            "deadlines": [
                {
                    "id": dl.id,
                    "equipment_id": dl.equipment_id,
                    "reason": dl.reason.value if dl.reason else None,
                    "deadline_date": (
                        dl.deadline_date.isoformat() if dl.deadline_date else None
                    ),
                    "work_order_id": dl.work_order_id,
                    "notes": dl.notes,
                }
                for dl in active_deadlines
            ],
        }

    async def calculate_maintenance_man_hours(self, days: int = 30) -> dict:
        """Sum labor hours from maintenance work orders in the given window."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        # Get work order IDs in the window
        wo_result = await self.db.execute(
            select(MaintenanceWorkOrder.id).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        wo_ids = [row[0] for row in wo_result.all()]

        if not wo_ids:
            return {
                "total_man_hours": 0.0,
                "labor_entry_count": 0,
                "period_days": days,
            }

        result = await self.db.execute(
            select(
                func.sum(MaintenanceLabor.hours),
                func.count(MaintenanceLabor.id),
            ).where(MaintenanceLabor.work_order_id.in_(wo_ids))
        )
        row = result.one()
        total_hours = row[0] or 0.0
        entry_count = row[1] or 0

        return {
            "total_man_hours": round(float(total_hours), 1),
            "labor_entry_count": entry_count,
            "period_days": days,
        }

    async def get_cannibalization_rate(self, days: int = 90) -> dict:
        """Calculate percentage of parts sourced via cannibalization."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        wo_result = await self.db.execute(
            select(MaintenanceWorkOrder.id).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        wo_ids = [row[0] for row in wo_result.all()]

        if not wo_ids:
            return {
                "total_parts": 0,
                "cannibalized_parts": 0,
                "cannibalization_rate_pct": 0.0,
                "period_days": days,
            }

        total_result = await self.db.execute(
            select(func.count(MaintenancePart.id)).where(
                MaintenancePart.work_order_id.in_(wo_ids)
            )
        )
        total_parts = total_result.scalar() or 0

        cann_result = await self.db.execute(
            select(func.count(MaintenancePart.id)).where(
                MaintenancePart.work_order_id.in_(wo_ids),
                MaintenancePart.source == PartSource.CANNIBALIZED,
            )
        )
        cann_parts = cann_result.scalar() or 0

        rate = round(cann_parts / total_parts * 100, 1) if total_parts > 0 else 0.0

        return {
            "total_parts": total_parts,
            "cannibalized_parts": cann_parts,
            "cannibalization_rate_pct": rate,
            "period_days": days,
        }

    async def get_top_fault_codes(self, limit: int = 10) -> dict:
        """Get most common fault descriptions from EquipmentFault records."""
        # Get equipment IDs for this unit
        equip_result = await self.db.execute(
            select(Equipment.id).where(Equipment.unit_id == self.unit_id)
        )
        equip_ids = [row[0] for row in equip_result.all()]

        if not equip_ids:
            return {"top_faults": [], "total_faults": 0}

        result = await self.db.execute(
            select(
                EquipmentFault.fault_description,
                func.count(EquipmentFault.id).label("count"),
            )
            .where(EquipmentFault.equipment_id.in_(equip_ids))
            .group_by(EquipmentFault.fault_description)
            .order_by(func.count(EquipmentFault.id).desc())
            .limit(limit)
        )
        rows = result.all()

        total_result = await self.db.execute(
            select(func.count(EquipmentFault.id)).where(
                EquipmentFault.equipment_id.in_(equip_ids)
            )
        )
        total_faults = total_result.scalar() or 0

        return {
            "top_faults": [
                {"fault_description": row[0], "count": row[1]} for row in rows
            ],
            "total_faults": total_faults,
        }

    async def get_comprehensive_analytics(self) -> dict:
        """Bundle all analytics into a single response."""
        deadline_rate = await self.calculate_deadline_rate()
        avg_repair = await self.calculate_avg_repair_time()
        parts_fill = await self.calculate_parts_fill_rate()
        overdue_pms = await self.get_overdue_pms()
        deadline_equip = await self.get_deadline_equipment()
        man_hours = await self.calculate_maintenance_man_hours()
        cann_rate = await self.get_cannibalization_rate()
        top_faults = await self.get_top_fault_codes()

        return {
            "unit_id": self.unit_id,
            "deadline_rate": deadline_rate,
            "mean_time_to_repair": avg_repair,
            "parts_fill_rate": parts_fill,
            "overdue_preventive_maintenance": overdue_pms,
            "deadline_equipment": deadline_equip,
            "maintenance_man_hours": man_hours,
            "cannibalization_rate": cann_rate,
            "top_fault_codes": top_faults,
        }
