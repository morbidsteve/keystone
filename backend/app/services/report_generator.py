"""Automated report generation service.

Pulls from all data sources (supply, equipment, maintenance, movements,
personnel) to compile structured report content.
"""

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func as sqla_func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.military import (
    SUPPLY_CLASS_NAMES,
    determine_readiness_status,
    determine_supply_status_by_dos,
)
from app.models.equipment import (
    Equipment,
    EquipmentAssetStatus,
    EquipmentFault,
    EquipmentStatus,
)
from app.models.maintenance import (
    MaintenanceLabor,
    MaintenancePart,
    MaintenanceWorkOrder,
    PartStatus,
    WorkOrderStatus,
)
from app.models.personnel import ConvoyPersonnel, Personnel, PersonnelStatus
from app.models.report import Report, ReportStatus, ReportType
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit


class ReportGenerator:
    """Generates structured report content from live data sources."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate(
        self,
        report_type: str,
        unit_id: int,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        """Route to the appropriate report generator by type."""
        generators = {
            "LOGSTAT": self._generate_logstat,
            "READINESS": self._generate_readiness,
            "SUPPLY_STATUS": self._generate_supply_status,
            "EQUIPMENT_STATUS": self._generate_equipment_status,
            "MAINTENANCE_SUMMARY": self._generate_maintenance_summary,
            "MOVEMENT_SUMMARY": self._generate_movement_summary,
            "PERSONNEL_STRENGTH": self._generate_personnel_strength,
        }
        gen = generators.get(report_type)
        if not gen:
            raise ValueError(f"Unknown report type: {report_type}")
        return await gen(unit_id, date_from, date_to)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _get_unit(self, unit_id: int) -> Optional[Unit]:
        result = await self.db.execute(select(Unit).where(Unit.id == unit_id))
        return result.scalar_one_or_none()

    def _unit_dict(self, unit: Unit) -> dict:
        return {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "uic": unit.uic,
        }

    def _period_dict(
        self,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        return {
            "period_start": date_from.isoformat() if date_from else None,
            "period_end": date_to.isoformat() if date_to else None,
        }

    # ------------------------------------------------------------------
    # LOGSTAT (Daily Logistics Status)
    # ------------------------------------------------------------------

    async def _generate_logstat(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)
        report_dtg = now.strftime("%d%H%MZ%b%y").upper()

        # --- Supply levels by class ---
        supply_query = select(SupplyStatusRecord).where(
            SupplyStatusRecord.unit_id == unit_id
        )
        if date_from:
            supply_query = supply_query.where(
                SupplyStatusRecord.reported_at >= date_from
            )
        if date_to:
            supply_query = supply_query.where(SupplyStatusRecord.reported_at <= date_to)
        supply_query = supply_query.order_by(
            SupplyStatusRecord.supply_class,
            SupplyStatusRecord.reported_at.desc(),
        )
        result = await self.db.execute(supply_query)
        supply_records = result.scalars().all()

        supply_sections: dict = {}
        seen_supply: set = set()
        for rec in supply_records:
            key = (rec.supply_class.value, rec.item_description)
            if key in seen_supply:
                continue
            seen_supply.add(key)
            sc = rec.supply_class
            if sc not in supply_sections:
                supply_sections[sc] = {
                    "class": sc.value,
                    "class_name": SUPPLY_CLASS_NAMES.get(sc, sc.value),  # type: ignore[call-overload]
                    "items": [],
                }
            supply_sections[sc]["items"].append(
                {
                    "item": rec.item_description,
                    "on_hand": rec.on_hand_qty,
                    "required": rec.required_qty,
                    "dos": rec.dos,
                    "consumption_rate": rec.consumption_rate,
                    "status": rec.status.value,
                }
            )

        for sc, section in supply_sections.items():
            if section["items"]:
                avg_dos = sum(i["dos"] for i in section["items"]) / len(
                    section["items"]
                )
                section["overall_status"] = determine_supply_status_by_dos(
                    avg_dos
                ).value

        # --- Equipment readiness rates ---
        eq_query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        result = await self.db.execute(eq_query)
        eq_records = result.scalars().all()
        total_poss = sum(r.total_possessed for r in eq_records)
        total_mc = sum(r.mission_capable for r in eq_records)
        equip_readiness_pct = (
            round(total_mc / total_poss * 100, 1) if total_poss > 0 else 0.0
        )

        # --- Open maintenance work orders ---
        wo_count_q = select(sqla_func.count(MaintenanceWorkOrder.id)).where(
            MaintenanceWorkOrder.unit_id == unit_id,
            MaintenanceWorkOrder.status != WorkOrderStatus.COMPLETE,
        )
        result = await self.db.execute(wo_count_q)
        open_wo_count = result.scalar() or 0

        # --- Active movements ---
        mv_count_q = select(sqla_func.count(Movement.id)).where(
            Movement.unit_id == unit_id,
            Movement.status.in_([MovementStatus.EN_ROUTE, MovementStatus.PLANNED]),
        )
        result = await self.db.execute(mv_count_q)
        active_movements = result.scalar() or 0

        # --- Personnel strength ---
        pers_count_q = select(sqla_func.count(Personnel.id)).where(
            Personnel.unit_id == unit_id,
            Personnel.status != PersonnelStatus.INACTIVE,
        )
        result = await self.db.execute(pers_count_q)
        personnel_count = result.scalar() or 0

        return {
            "report_type": "LOGSTAT",
            "unit": self._unit_dict(unit),
            "dtg": report_dtg,
            "as_of": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "supply_status": [
                supply_sections[sc]
                for sc in sorted(supply_sections.keys(), key=lambda x: x.value)
            ],
            "equipment_readiness": {
                "total_possessed": total_poss,
                "total_mission_capable": total_mc,
                "readiness_pct": equip_readiness_pct,
                "status": determine_readiness_status(equip_readiness_pct).value,
            },
            "open_work_orders": open_wo_count,
            "active_movements": active_movements,
            "personnel_strength": personnel_count,
            "total_supply_items": sum(
                len(s["items"]) for s in supply_sections.values()
            ),
        }

    # ------------------------------------------------------------------
    # READINESS (Equipment Readiness)
    # ------------------------------------------------------------------

    async def _generate_readiness(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)

        # Per-type MC/NMC from EquipmentStatus
        eq_query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        if date_from:
            eq_query = eq_query.where(EquipmentStatus.reported_at >= date_from)
        if date_to:
            eq_query = eq_query.where(EquipmentStatus.reported_at <= date_to)
        eq_query = eq_query.order_by(
            EquipmentStatus.nomenclature, EquipmentStatus.reported_at.desc()
        )
        result = await self.db.execute(eq_query)
        eq_records = result.scalars().all()

        equipment_types: dict = {}
        seen: set = set()
        for rec in eq_records:
            if rec.tamcn in seen:
                continue
            seen.add(rec.tamcn)
            equipment_types[rec.tamcn] = {
                "tamcn": rec.tamcn,
                "nomenclature": rec.nomenclature,
                "total_possessed": rec.total_possessed,
                "mission_capable": rec.mission_capable,
                "nmc_maintenance": rec.not_mission_capable_maintenance,
                "nmc_supply": rec.not_mission_capable_supply,
                "readiness_pct": rec.readiness_pct,
                "status": determine_readiness_status(rec.readiness_pct).value,
            }

        total_poss = sum(e["total_possessed"] for e in equipment_types.values())
        total_mc = sum(e["mission_capable"] for e in equipment_types.values())
        overall_pct = round(total_mc / total_poss * 100, 1) if total_poss > 0 else 0.0

        # Individual equipment by status
        indiv_query = select(Equipment).where(Equipment.unit_id == unit_id)
        result = await self.db.execute(indiv_query)
        indiv_items = result.scalars().all()

        status_breakdown: dict = {}
        deadlined_items = []
        for item in indiv_items:
            status_val = item.status.value
            status_breakdown[status_val] = status_breakdown.get(status_val, 0) + 1
            if item.status == EquipmentAssetStatus.DEADLINED:
                deadlined_items.append(
                    {
                        "bumper_number": item.bumper_number,
                        "nomenclature": item.nomenclature,
                        "tamcn": item.tamcn,
                        "equipment_type": item.equipment_type,
                    }
                )

        return {
            "report_type": "READINESS",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "overall_readiness_pct": overall_pct,
            "overall_status": determine_readiness_status(overall_pct).value,
            "total_possessed": total_poss,
            "total_mission_capable": total_mc,
            "total_nmc": total_poss - total_mc,
            "equipment_types": list(equipment_types.values()),
            "equipment_type_count": len(equipment_types),
            "individual_status_breakdown": status_breakdown,
            "deadlined_items": deadlined_items[:10],
        }

    # ------------------------------------------------------------------
    # SUPPLY_STATUS
    # ------------------------------------------------------------------

    async def _generate_supply_status(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)
        class_summaries = []

        for sc in SupplyClass:
            query = select(SupplyStatusRecord).where(
                SupplyStatusRecord.unit_id == unit_id,
                SupplyStatusRecord.supply_class == sc,
            )
            if date_from:
                query = query.where(SupplyStatusRecord.reported_at >= date_from)
            if date_to:
                query = query.where(SupplyStatusRecord.reported_at <= date_to)
            query = query.order_by(SupplyStatusRecord.reported_at.desc())
            result = await self.db.execute(query)
            records = result.scalars().all()

            if not records:
                continue

            total_on_hand = sum(r.on_hand_qty for r in records)
            total_required = sum(r.required_qty for r in records)
            avg_dos = sum(r.dos for r in records) / len(records)
            avg_rate = sum(r.consumption_rate for r in records) / len(records)

            red_items = [r for r in records if r.status == SupplyStatus.RED]
            amber_items = [r for r in records if r.status == SupplyStatus.AMBER]

            class_summaries.append(
                {
                    "supply_class": sc.value,
                    "class_name": SUPPLY_CLASS_NAMES.get(sc, sc.value),
                    "total_on_hand": round(total_on_hand, 1),
                    "total_required": round(total_required, 1),
                    "fill_rate_pct": (
                        round(total_on_hand / total_required * 100, 1)
                        if total_required > 0
                        else 0.0
                    ),
                    "avg_dos": round(avg_dos, 1),
                    "avg_consumption_rate": round(avg_rate, 2),
                    "item_count": len(records),
                    "red_items": len(red_items),
                    "amber_items": len(amber_items),
                    "status": determine_supply_status_by_dos(avg_dos).value,
                    "critical_items": [
                        {
                            "item": r.item_description,
                            "on_hand": r.on_hand_qty,
                            "required": r.required_qty,
                            "dos": r.dos,
                        }
                        for r in red_items[:5]
                    ],
                }
            )

        red_classes = sum(1 for c in class_summaries if c["status"] == "RED")
        amber_classes = sum(1 for c in class_summaries if c["status"] == "AMBER")

        return {
            "report_type": "SUPPLY_STATUS",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "overall_health": (
                "RED"
                if red_classes > 0
                else ("AMBER" if amber_classes > 0 else "GREEN")
            ),
            "total_classes_tracked": len(class_summaries),
            "red_classes": red_classes,
            "amber_classes": amber_classes,
            "class_summaries": class_summaries,
        }

    # ------------------------------------------------------------------
    # EQUIPMENT_STATUS
    # ------------------------------------------------------------------

    async def _generate_equipment_status(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)

        # Fleet aggregate readiness from EquipmentStatus
        eq_query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        if date_from:
            eq_query = eq_query.where(EquipmentStatus.reported_at >= date_from)
        if date_to:
            eq_query = eq_query.where(EquipmentStatus.reported_at <= date_to)
        result = await self.db.execute(eq_query)
        eq_records = result.scalars().all()

        total_poss = sum(r.total_possessed for r in eq_records)
        total_mc = sum(r.mission_capable for r in eq_records)
        total_nmcm = sum(r.not_mission_capable_maintenance for r in eq_records)
        total_nmcs = sum(r.not_mission_capable_supply for r in eq_records)
        fleet_readiness = (
            round(total_mc / total_poss * 100, 1) if total_poss > 0 else 0.0
        )

        fleet_by_type = [
            {
                "tamcn": r.tamcn,
                "nomenclature": r.nomenclature,
                "total_possessed": r.total_possessed,
                "mission_capable": r.mission_capable,
                "nmc_maintenance": r.not_mission_capable_maintenance,
                "nmc_supply": r.not_mission_capable_supply,
                "readiness_pct": r.readiness_pct,
                "status": determine_readiness_status(r.readiness_pct).value,
            }
            for r in eq_records
        ]

        # Individual equipment status breakdown
        indiv_query = select(Equipment).where(Equipment.unit_id == unit_id)
        result = await self.db.execute(indiv_query)
        indiv_items = result.scalars().all()

        status_counts: dict = {s.value: 0 for s in EquipmentAssetStatus}
        deadlined_with_faults = []
        for item in indiv_items:
            status_counts[item.status.value] += 1

        # Top 5 deadlined items with faults
        deadlined = [
            i for i in indiv_items if i.status == EquipmentAssetStatus.DEADLINED
        ]
        for dl_item in deadlined[:5]:
            fault_q = (
                select(EquipmentFault)
                .where(
                    EquipmentFault.equipment_id == dl_item.id,
                    EquipmentFault.resolved_at.is_(None),
                )
                .order_by(EquipmentFault.reported_at.desc())
                .limit(1)
            )
            result = await self.db.execute(fault_q)
            fault = result.scalar_one_or_none()
            deadlined_with_faults.append(
                {
                    "bumper_number": dl_item.bumper_number,
                    "nomenclature": dl_item.nomenclature,
                    "tamcn": dl_item.tamcn,
                    "equipment_type": dl_item.equipment_type,
                    "fault": fault.fault_description if fault else "No active fault",
                    "fault_severity": fault.severity.value if fault else None,
                }
            )

        return {
            "report_type": "EQUIPMENT_STATUS",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "fleet_readiness": {
                "total_possessed": total_poss,
                "total_mission_capable": total_mc,
                "total_nmc_maintenance": total_nmcm,
                "total_nmc_supply": total_nmcs,
                "readiness_pct": fleet_readiness,
                "status": determine_readiness_status(fleet_readiness).value,
            },
            "fleet_by_type": fleet_by_type,
            "individual_status_breakdown": status_counts,
            "individual_total": len(indiv_items),
            "top_deadlined_items": deadlined_with_faults,
        }

    # ------------------------------------------------------------------
    # MAINTENANCE_SUMMARY
    # ------------------------------------------------------------------

    async def _generate_maintenance_summary(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)

        # Work orders
        wo_query = select(MaintenanceWorkOrder).where(
            MaintenanceWorkOrder.unit_id == unit_id
        )
        if date_from:
            wo_query = wo_query.where(MaintenanceWorkOrder.created_at >= date_from)
        if date_to:
            wo_query = wo_query.where(MaintenanceWorkOrder.created_at <= date_to)
        result = await self.db.execute(wo_query)
        work_orders = result.scalars().all()

        wo_ids = [wo.id for wo in work_orders]

        # Status counts
        status_counts: dict = {s.value: 0 for s in WorkOrderStatus}
        total_hours = 0.0
        completed_count = 0
        completion_times: list = []

        for wo in work_orders:
            status_counts[wo.status.value] += 1
            if wo.actual_hours:
                total_hours += wo.actual_hours
            if (
                wo.status == WorkOrderStatus.COMPLETE
                and wo.completed_at
                and wo.created_at
            ):
                delta = wo.completed_at - wo.created_at
                completion_times.append(delta.total_seconds() / 3600)
                completed_count += 1

        avg_completion_hours = (
            round(sum(completion_times) / len(completion_times), 1)
            if completion_times
            else 0.0
        )

        # Parts on order
        parts_on_order = 0
        if wo_ids:
            parts_q = select(sqla_func.count(MaintenancePart.id)).where(
                MaintenancePart.work_order_id.in_(wo_ids),
                MaintenancePart.status == PartStatus.ON_ORDER,
            )
            result = await self.db.execute(parts_q)
            parts_on_order = result.scalar() or 0

        # Labor hours summary
        labor_hours = 0.0
        if wo_ids:
            labor_q = select(sqla_func.sum(MaintenanceLabor.hours)).where(
                MaintenanceLabor.work_order_id.in_(wo_ids),
            )
            result = await self.db.execute(labor_q)
            labor_hours = result.scalar() or 0.0

        # Top issues by equipment type (count WO per individual equipment type)
        top_issues: dict = {}
        for wo in work_orders:
            if wo.status == WorkOrderStatus.COMPLETE:
                continue
            eq_id = wo.individual_equipment_id
            if eq_id:
                # Look up equipment type
                eq_q = select(Equipment.equipment_type).where(Equipment.id == eq_id)
                result = await self.db.execute(eq_q)
                eq_type = result.scalar_one_or_none()
                if eq_type:
                    top_issues[eq_type] = top_issues.get(eq_type, 0) + 1

        sorted_issues = sorted(top_issues.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "report_type": "MAINTENANCE_SUMMARY",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "work_order_counts": status_counts,
            "total_work_orders": len(work_orders),
            "avg_completion_time_hours": avg_completion_hours,
            "total_labor_hours": round(float(labor_hours), 1),
            "parts_on_order": parts_on_order,
            "top_issues": [
                {"equipment_type": et, "open_work_orders": cnt}
                for et, cnt in sorted_issues
            ],
        }

    # ------------------------------------------------------------------
    # MOVEMENT_SUMMARY
    # ------------------------------------------------------------------

    async def _generate_movement_summary(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)

        mv_query = select(Movement).where(Movement.unit_id == unit_id)
        if date_from:
            mv_query = mv_query.where(Movement.reported_at >= date_from)
        if date_to:
            mv_query = mv_query.where(Movement.reported_at <= date_to)
        result = await self.db.execute(mv_query)
        movements = result.scalars().all()

        status_counts: dict = {s.value: 0 for s in MovementStatus}
        total_vehicles = 0
        total_personnel = 0

        for mv in movements:
            status_counts[mv.status.value] += 1
            total_vehicles += mv.vehicle_count

        # Personnel in transit (count convoy_personnel for active movements)
        active_movement_ids = [
            mv.id
            for mv in movements
            if mv.status in (MovementStatus.EN_ROUTE, MovementStatus.PLANNED)
        ]
        if active_movement_ids:
            cp_q = select(sqla_func.count(ConvoyPersonnel.id)).where(
                ConvoyPersonnel.movement_id.in_(active_movement_ids)
            )
            result = await self.db.execute(cp_q)
            total_personnel = result.scalar() or 0

        recent_completions = [
            {
                "convoy_id": mv.convoy_id,
                "origin": mv.origin,
                "destination": mv.destination,
                "vehicle_count": mv.vehicle_count,
                "arrival": mv.actual_arrival.isoformat() if mv.actual_arrival else None,
            }
            for mv in movements
            if mv.status == MovementStatus.COMPLETE
        ][:5]

        return {
            "report_type": "MOVEMENT_SUMMARY",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "status_counts": status_counts,
            "total_movements": len(movements),
            "total_vehicles_in_transit": sum(
                mv.vehicle_count
                for mv in movements
                if mv.status == MovementStatus.EN_ROUTE
            ),
            "total_personnel_in_transit": total_personnel,
            "recent_completions": recent_completions,
        }

    # ------------------------------------------------------------------
    # PERSONNEL_STRENGTH
    # ------------------------------------------------------------------

    async def _generate_personnel_strength(
        self,
        unit_id: int,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> dict:
        unit = await self._get_unit(unit_id)
        if not unit:
            return {"error": f"Unit {unit_id} not found"}

        now = datetime.now(timezone.utc)

        pers_query = select(Personnel).where(Personnel.unit_id == unit_id)
        result = await self.db.execute(pers_query)
        all_personnel = result.scalars().all()

        status_breakdown: dict = {s.value: 0 for s in PersonnelStatus}
        for p in all_personnel:
            status_breakdown[p.status.value] += 1

        total_assigned = len(all_personnel)
        active_count = sum(
            1 for p in all_personnel if p.status != PersonnelStatus.INACTIVE
        )

        # Group by rank
        rank_breakdown: dict = {}
        for p in all_personnel:
            rank = p.rank or "Unknown"
            rank_breakdown[rank] = rank_breakdown.get(rank, 0) + 1

        # MOS breakdown
        mos_breakdown: dict = {}
        for p in all_personnel:
            mos = p.mos or "Unknown"
            mos_breakdown[mos] = mos_breakdown.get(mos, 0) + 1

        return {
            "report_type": "PERSONNEL_STRENGTH",
            "unit": self._unit_dict(unit),
            "generated_at": now.isoformat(),
            **self._period_dict(date_from, date_to),
            "total_assigned": total_assigned,
            "total_active": active_count,
            "status_breakdown": status_breakdown,
            "rank_breakdown": rank_breakdown,
            "mos_breakdown": mos_breakdown,
        }


async def generate_and_save_report(
    db: AsyncSession,
    report_type: str,
    unit_id: int,
    title: str,
    user_id: int,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> Report:
    """Generate report content and persist as a Report record."""
    generator = ReportGenerator(db)
    content = await generator.generate(report_type, unit_id, date_from, date_to)

    report = Report(
        unit_id=unit_id,
        report_type=ReportType(report_type),
        title=title,
        content=json.dumps(content),
        status=ReportStatus.READY,
        generated_by=user_id,
        period_start=date_from,
        period_end=date_to,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report
