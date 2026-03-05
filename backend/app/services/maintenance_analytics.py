"""Maintenance analytics service — database-agnostic calculations."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import Equipment, EquipmentAssetStatus, EquipmentFault
from app.models.maintenance import (
    LaborType,
    MaintenanceLabor,
    MaintenancePart,
    MaintenanceWorkOrder,
    PartSource,
    PartStatus,
    WorkOrderCategory,
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
            select(func.count(Equipment.id)).where(Equipment.unit_id == self.unit_id)
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
                MaintenancePart.status.in_([PartStatus.RECEIVED, PartStatus.INSTALLED]),
            )
        )
        filled_parts = filled_result.scalar() or 0

        fill_rate = (
            round(filled_parts / total_parts * 100, 1) if total_parts > 0 else 0.0
        )

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

    async def get_personnel_workload(self, days: int = 30) -> list[dict]:
        """Top 10 personnel by labor hours with breakdown by labor type."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        # Get work order IDs in window
        wo_result = await self.db.execute(
            select(MaintenanceWorkOrder.id).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        wo_ids = [row[0] for row in wo_result.all()]
        if not wo_ids:
            return []

        # Get labor entries with personnel info
        from app.models.personnel import Personnel

        result = await self.db.execute(
            select(
                Personnel.id,
                Personnel.edipi,
                Personnel.first_name,
                Personnel.last_name,
                Personnel.rank,
                Personnel.mos,
                MaintenanceLabor.labor_type,
                func.sum(MaintenanceLabor.hours).label("hours"),
                func.count(func.distinct(MaintenanceLabor.work_order_id)).label("wo_count"),
            )
            .select_from(MaintenanceLabor)
            .join(Personnel, MaintenanceLabor.personnel_id == Personnel.id)
            .where(MaintenanceLabor.work_order_id.in_(wo_ids))
            .group_by(
                Personnel.id,
                Personnel.edipi,
                Personnel.first_name,
                Personnel.last_name,
                Personnel.rank,
                Personnel.mos,
                MaintenanceLabor.labor_type,
            )
        )
        rows = result.all()

        # Aggregate by personnel
        personnel_map: dict[int, dict] = {}
        for row in rows:
            pid = row[0]
            if pid not in personnel_map:
                personnel_map[pid] = {
                    "personnel_id": pid,
                    "edipi": row[1],
                    "first_name": row[2],
                    "last_name": row[3],
                    "rank": row[4],
                    "mos": row[5],
                    "total_hours": 0.0,
                    "work_order_count": 0,
                    "labor_breakdown": {lt.value: 0.0 for lt in LaborType},
                }
            personnel_map[pid]["total_hours"] += float(row[7] or 0)
            personnel_map[pid]["work_order_count"] = max(
                personnel_map[pid]["work_order_count"], int(row[8] or 0)
            )
            if row[6]:
                personnel_map[pid]["labor_breakdown"][row[6].value] = float(row[7] or 0)

        result_list = list(personnel_map.values())
        for p in result_list:
            p["avg_hours_per_wo"] = round(
                p["total_hours"] / max(p["work_order_count"], 1), 1
            )
            p["total_hours"] = round(p["total_hours"], 1)

        return sorted(result_list, key=lambda x: x["total_hours"], reverse=True)[:10]

    async def get_equipment_reliability(self, days: int = 90) -> list[dict]:
        """Top 10 equipment types by WO count, corrective vs preventive."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        from sqlalchemy import case as sql_case

        result = await self.db.execute(
            select(
                Equipment.equipment_type,
                func.count(MaintenanceWorkOrder.id).label("total_wos"),
                func.sum(
                    sql_case(
                        (MaintenanceWorkOrder.category == WorkOrderCategory.CORRECTIVE, 1),
                        else_=0,
                    )
                ).label("corrective"),
                func.sum(
                    sql_case(
                        (MaintenanceWorkOrder.category == WorkOrderCategory.PREVENTIVE, 1),
                        else_=0,
                    )
                ).label("preventive"),
            )
            .select_from(MaintenanceWorkOrder)
            .outerjoin(
                Equipment,
                MaintenanceWorkOrder.individual_equipment_id == Equipment.id,
            )
            .where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
            .group_by(Equipment.equipment_type)
            .order_by(func.count(MaintenanceWorkOrder.id).desc())
            .limit(10)
        )
        rows = result.all()

        return [
            {
                "equipment_type": row[0] or "UNKNOWN",
                "total_wos": int(row[1] or 0),
                "corrective_count": int(row[2] or 0),
                "preventive_count": int(row[3] or 0),
                "corrective_pct": round(
                    int(row[2] or 0) / max(int(row[1] or 0), 1) * 100, 1
                ),
                "preventive_pct": round(
                    int(row[3] or 0) / max(int(row[1] or 0), 1) * 100, 1
                ),
            }
            for row in rows
        ]

    async def get_parts_failure_analysis(self, days: int = 90) -> list[dict]:
        """Top 10 parts by replacement frequency and cost."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        wo_result = await self.db.execute(
            select(MaintenanceWorkOrder.id).where(
                MaintenanceWorkOrder.unit_id == self.unit_id,
                MaintenanceWorkOrder.created_at >= cutoff,
            )
        )
        wo_ids = [row[0] for row in wo_result.all()]
        if not wo_ids:
            return []

        result = await self.db.execute(
            select(
                MaintenancePart.part_number,
                MaintenancePart.nomenclature,
                MaintenancePart.nsn,
                func.count(MaintenancePart.id).label("count"),
                func.sum(MaintenancePart.quantity).label("total_qty"),
                func.avg(MaintenancePart.unit_cost).label("avg_cost"),
            )
            .where(MaintenancePart.work_order_id.in_(wo_ids))
            .group_by(
                MaintenancePart.part_number,
                MaintenancePart.nomenclature,
                MaintenancePart.nsn,
            )
            .order_by(func.count(MaintenancePart.id).desc())
            .limit(10)
        )
        rows = result.all()

        return [
            {
                "part_number": row[0],
                "nomenclature": row[1],
                "nsn": row[2] or "N/A",
                "replacement_count": int(row[3] or 0),
                "total_quantity": int(row[4] or 0),
                "avg_cost_per_part": round(float(row[5] or 0), 2),
                "total_cost": round(float(row[4] or 0) * float(row[5] or 0), 2),
            }
            for row in rows
        ]

    async def get_mtbf_mttr(self) -> list[dict]:
        """MTBF and MTTR by equipment type using Python datetime math."""
        equip_result = await self.db.execute(
            select(Equipment.id, Equipment.equipment_type).where(
                Equipment.unit_id == self.unit_id
            )
        )
        equipment_rows = equip_result.all()

        # Group by equipment_type
        type_wos: dict[str, list] = {}
        for eq_id, eq_type in equipment_rows:
            wo_result = await self.db.execute(
                select(
                    MaintenanceWorkOrder.created_at,
                    MaintenanceWorkOrder.completed_at,
                )
                .where(
                    MaintenanceWorkOrder.individual_equipment_id == eq_id,
                    MaintenanceWorkOrder.category == WorkOrderCategory.CORRECTIVE,
                )
                .order_by(MaintenanceWorkOrder.created_at.asc())
            )
            wos = wo_result.all()
            key = eq_type or "UNKNOWN"
            if key not in type_wos:
                type_wos[key] = []
            type_wos[key].extend(wos)

        results = []
        for eq_type, wos in type_wos.items():
            if len(wos) < 2:
                continue

            # Sort by created_at
            wos.sort(key=lambda x: x[0])

            # MTBF
            intervals = []
            for i in range(1, len(wos)):
                delta = (wos[i][0] - wos[i - 1][0]).total_seconds() / 86400
                if delta > 0:
                    intervals.append(delta)
            mtbf = sum(intervals) / len(intervals) if intervals else 0

            # MTTR
            mttr_samples = []
            for created, completed in wos:
                if completed:
                    hours = (completed - created).total_seconds() / 3600
                    if hours > 0:
                        mttr_samples.append(hours)
            mttr = sum(mttr_samples) / len(mttr_samples) if mttr_samples else 0

            # Trend: last 30 days vs previous 30 days
            now = datetime.now(timezone.utc)
            cutoff_30 = now - timedelta(days=30)
            cutoff_60 = now - timedelta(days=60)
            recent = [w for w in wos if w[0] >= cutoff_30]
            older = [w for w in wos if cutoff_60 <= w[0] < cutoff_30]

            trend = "STABLE"
            if len(recent) > 1 and len(older) > 1:
                recent_intervals = []
                for i in range(1, len(recent)):
                    d = (recent[i][0] - recent[i - 1][0]).total_seconds() / 86400
                    if d > 0:
                        recent_intervals.append(d)
                older_intervals = []
                for i in range(1, len(older)):
                    d = (older[i][0] - older[i - 1][0]).total_seconds() / 86400
                    if d > 0:
                        older_intervals.append(d)
                if recent_intervals and older_intervals:
                    r_avg = sum(recent_intervals) / len(recent_intervals)
                    o_avg = sum(older_intervals) / len(older_intervals)
                    if r_avg > o_avg * 1.1:
                        trend = "IMPROVING"
                    elif r_avg < o_avg * 0.9:
                        trend = "DEGRADING"

            # Health score
            if mtbf > 90:
                score = 100
            elif mtbf > 30:
                score = 60
            else:
                score = 30
            if trend == "IMPROVING":
                score = min(100, score + 20)
            elif trend == "DEGRADING":
                score = max(0, score - 20)

            results.append({
                "equipment_type": eq_type,
                "mtbf_days": round(mtbf, 1),
                "mttr_hours": round(mttr, 1),
                "mtbf_trend": trend,
                "corrective_wos_total": len(wos),
                "last_corrective_date": wos[-1][0].isoformat() if wos else None,
                "health_score": score,
            })

        return sorted(results, key=lambda x: x["mtbf_days"])

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
