"""PDF report generation using fpdf2.

Converts structured report JSON content into a formatted PDF document
with headers, tables, metadata, classification banners, and page numbers.
"""

import io
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fpdf import FPDF

logger = logging.getLogger(__name__)

# Classification default (configurable per deployment)
CLASSIFICATION = "UNCLASSIFIED"


class ReportPDF(FPDF):
    """Custom PDF class with header/footer for KEYSTONE reports."""

    def __init__(self, title: str, classification: str = CLASSIFICATION):
        super().__init__()
        self.report_title = title
        self.classification = classification

    def header(self):
        # Classification banner
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(255, 0, 0)
        self.cell(0, 5, self.classification, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(1)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, f"KEYSTONE - {self.classification}", align="L")
        self.cell(0, 5, f"Page {self.page_no()}/{{nb}}", align="R")


def generate_report_pdf(
    title: str,
    report_type: str,
    content: Dict[str, Any],
    classification: str = CLASSIFICATION,
) -> bytes:
    """Generate a PDF document from structured report content.

    Returns the PDF as raw bytes suitable for streaming as a response.
    """
    pdf = ReportPDF(title=title, classification=classification)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ---- Title block ----
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, title, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # ---- Metadata ----
    pdf.set_font("Helvetica", "", 9)
    unit = content.get("unit")
    if unit:
        unit_str = f"{unit.get('name', '')} ({unit.get('abbreviation', '')})"
        if unit.get("uic"):
            unit_str += f" - UIC: {unit['uic']}"
        _add_meta_line(pdf, "Unit", unit_str)

    _add_meta_line(pdf, "Report Type", report_type)

    gen_at = content.get("generated_at") or content.get("as_of")
    if gen_at:
        _add_meta_line(pdf, "Generated", _format_dt(gen_at))

    dtg = content.get("dtg")
    if dtg:
        _add_meta_line(pdf, "DTG", dtg)

    period_start = content.get("period_start")
    period_end = content.get("period_end")
    if period_start or period_end:
        period_str = f"{_format_dt(period_start) if period_start else 'N/A'} to {_format_dt(period_end) if period_end else 'N/A'}"
        _add_meta_line(pdf, "Period", period_str)

    pdf.ln(4)
    _add_separator(pdf)
    pdf.ln(4)

    # ---- Type-specific content ----
    renderer = _RENDERERS.get(report_type, _render_generic)
    renderer(pdf, content)

    # Output bytes
    buf = io.BytesIO()
    pdf.output(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _add_meta_line(pdf: FPDF, label: str, value: str):
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(35, 5, f"{label}:", new_x="END")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, value, new_x="LMARGIN", new_y="NEXT")


def _add_separator(pdf: FPDF):
    y = pdf.get_y()
    pdf.set_draw_color(180, 180, 180)
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)


def _section_heading(pdf: FPDF, text: str):
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 80, 160)
    pdf.cell(0, 7, text.upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(1)


def _stat_line(pdf: FPDF, label: str, value: Any):
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(55, 5, f"{label}:", new_x="END")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, str(value), new_x="LMARGIN", new_y="NEXT")


def _format_dt(val: Optional[str]) -> str:
    if not val:
        return "N/A"
    try:
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y %H:%M UTC")
    except (ValueError, AttributeError):
        return str(val)


def _add_table(pdf: FPDF, headers: List[str], rows: List[List[str]], col_widths: Optional[List[float]] = None):
    """Draw a simple table."""
    if not rows:
        return
    page_w = pdf.w - pdf.l_margin - pdf.r_margin
    if col_widths is None:
        col_widths = [page_w / len(headers)] * len(headers)

    # Ensure widths fit page
    total = sum(col_widths)
    if total > page_w:
        scale = page_w / total
        col_widths = [w * scale for w in col_widths]

    # Header row
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(230, 235, 245)
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 6, h, border=1, fill=True, new_x="END")
    pdf.ln()

    # Data rows
    pdf.set_font("Helvetica", "", 8)
    for row in rows:
        # Check if we need a new page
        if pdf.get_y() > pdf.h - 25:
            pdf.add_page()
            # Re-draw header
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_fill_color(230, 235, 245)
            for i, h in enumerate(headers):
                pdf.cell(col_widths[i], 6, h, border=1, fill=True, new_x="END")
            pdf.ln()
            pdf.set_font("Helvetica", "", 8)

        for i, cell_val in enumerate(row):
            w = col_widths[i] if i < len(col_widths) else col_widths[-1]
            pdf.cell(w, 5, str(cell_val)[:50], border=1, new_x="END")
        pdf.ln()


def _status_str(val: str) -> str:
    return val.replace("_", " ") if val else "N/A"


# ---------------------------------------------------------------------------
# Report-type renderers
# ---------------------------------------------------------------------------


def _render_logstat(pdf: FPDF, content: Dict[str, Any]):
    # Key metrics
    _section_heading(pdf, "Key Metrics")
    eq = content.get("equipment_readiness", {})
    _stat_line(pdf, "Equipment Readiness", f"{eq.get('readiness_pct', 0)}% ({eq.get('status', 'N/A')})")
    _stat_line(pdf, "Total Possessed", eq.get("total_possessed", 0))
    _stat_line(pdf, "Mission Capable", eq.get("total_mission_capable", 0))
    _stat_line(pdf, "Open Work Orders", content.get("open_work_orders", 0))
    _stat_line(pdf, "Active Movements", content.get("active_movements", 0))
    _stat_line(pdf, "Personnel Strength", content.get("personnel_strength", 0))
    _stat_line(pdf, "Total Supply Items", content.get("total_supply_items", 0))

    # Supply status table
    supply = content.get("supply_status", [])
    if supply:
        _section_heading(pdf, "Supply Status by Class")
        headers = ["CLASS", "NAME", "ITEMS", "STATUS"]
        rows = []
        for s in supply:
            rows.append([
                s.get("class", ""),
                s.get("class_name", ""),
                str(len(s.get("items", []))),
                s.get("overall_status", "N/A"),
            ])
        _add_table(pdf, headers, rows, [20, 60, 30, 30])


def _render_readiness(pdf: FPDF, content: Dict[str, Any]):
    _section_heading(pdf, "Overall Readiness")
    _stat_line(pdf, "Overall Readiness", f"{content.get('overall_readiness_pct', 0)}%")
    _stat_line(pdf, "Status", content.get("overall_status", "N/A"))
    _stat_line(pdf, "Total Possessed", content.get("total_possessed", 0))
    _stat_line(pdf, "Mission Capable", content.get("total_mission_capable", 0))
    _stat_line(pdf, "Not MC", content.get("total_nmc", 0))

    eq_types = content.get("equipment_types", [])
    if eq_types:
        _section_heading(pdf, "Equipment by Type")
        headers = ["TAMCN", "NOMENCLATURE", "POSS", "MC", "NMC-M", "NMC-S", "RATE", "STATUS"]
        rows = []
        for e in eq_types:
            rows.append([
                e.get("tamcn", ""),
                e.get("nomenclature", ""),
                str(e.get("total_possessed", 0)),
                str(e.get("mission_capable", 0)),
                str(e.get("nmc_maintenance", "-")),
                str(e.get("nmc_supply", "-")),
                f"{e.get('readiness_pct', 0)}%",
                e.get("status", ""),
            ])
        _add_table(pdf, headers, rows, [20, 40, 15, 15, 18, 18, 18, 22])

    deadlined = content.get("deadlined_items", [])
    if deadlined:
        _section_heading(pdf, "Deadlined Items")
        headers = ["BUMPER", "TYPE", "TAMCN"]
        rows = [[d.get("bumper_number", ""), d.get("equipment_type", ""), d.get("tamcn", "")] for d in deadlined]
        _add_table(pdf, headers, rows, [40, 60, 40])


def _render_supply_status(pdf: FPDF, content: Dict[str, Any]):
    _section_heading(pdf, "Supply Overview")
    _stat_line(pdf, "Overall Health", content.get("overall_health", "N/A"))
    _stat_line(pdf, "Classes Tracked", content.get("total_classes_tracked", 0))
    _stat_line(pdf, "Red Classes", content.get("red_classes", 0))
    _stat_line(pdf, "Amber Classes", content.get("amber_classes", 0))

    summaries = content.get("class_summaries", [])
    if summaries:
        _section_heading(pdf, "Class Breakdown")
        headers = ["CLASS", "NAME", "ON HAND", "REQUIRED", "FILL%", "AVG DOS", "RED", "STATUS"]
        rows = []
        for c in summaries:
            rows.append([
                c.get("supply_class", ""),
                c.get("class_name", ""),
                str(c.get("total_on_hand", 0)),
                str(c.get("total_required", 0)),
                f"{c.get('fill_rate_pct', 0)}%",
                str(c.get("avg_dos", 0)),
                str(c.get("red_items", 0)),
                c.get("status", ""),
            ])
        _add_table(pdf, headers, rows, [18, 40, 22, 22, 18, 20, 14, 22])

        # Critical items
        has_critical = any(c.get("critical_items") for c in summaries)
        if has_critical:
            _section_heading(pdf, "Critical Items (Red Status)")
            headers = ["CLASS", "ITEM", "ON HAND", "REQUIRED", "DOS"]
            rows = []
            for c in summaries:
                for ci in c.get("critical_items", []):
                    rows.append([
                        c.get("supply_class", ""),
                        ci.get("item", ""),
                        str(ci.get("on_hand", 0)),
                        str(ci.get("required", 0)),
                        str(ci.get("dos", 0)),
                    ])
            _add_table(pdf, headers, rows, [20, 60, 25, 25, 25])


def _render_equipment_status(pdf: FPDF, content: Dict[str, Any]):
    fr = content.get("fleet_readiness", {})
    if fr:
        _section_heading(pdf, "Fleet Readiness")
        _stat_line(pdf, "Readiness", f"{fr.get('readiness_pct', 0)}% ({fr.get('status', 'N/A')})")
        _stat_line(pdf, "Total Possessed", fr.get("total_possessed", 0))
        _stat_line(pdf, "Mission Capable", fr.get("total_mission_capable", 0))
        _stat_line(pdf, "NMC Maintenance", fr.get("total_nmc_maintenance", 0))
        _stat_line(pdf, "NMC Supply", fr.get("total_nmc_supply", 0))

    fleet = content.get("fleet_by_type", [])
    if fleet:
        _section_heading(pdf, "Fleet by Type")
        headers = ["TAMCN", "NOMENCLATURE", "POSS", "MC", "NMC-M", "NMC-S", "RATE", "STATUS"]
        rows = []
        for e in fleet:
            rows.append([
                e.get("tamcn", ""),
                e.get("nomenclature", ""),
                str(e.get("total_possessed", 0)),
                str(e.get("mission_capable", 0)),
                str(e.get("nmc_maintenance", "-")),
                str(e.get("nmc_supply", "-")),
                f"{e.get('readiness_pct', 0)}%",
                e.get("status", ""),
            ])
        _add_table(pdf, headers, rows, [20, 40, 15, 15, 18, 18, 18, 22])

    breakdown = content.get("individual_status_breakdown", {})
    if breakdown:
        _section_heading(pdf, f"Individual Equipment Status ({content.get('individual_total', 0)} total)")
        for status, count in breakdown.items():
            _stat_line(pdf, _status_str(status), count)

    deadlined = content.get("top_deadlined_items", [])
    if deadlined:
        _section_heading(pdf, "Top Deadlined Items")
        headers = ["BUMPER", "TYPE", "TAMCN", "FAULT", "SEVERITY"]
        rows = [
            [
                d.get("bumper_number", ""),
                d.get("equipment_type", ""),
                d.get("tamcn", ""),
                (d.get("fault") or "N/A")[:40],
                d.get("fault_severity") or "N/A",
            ]
            for d in deadlined
        ]
        _add_table(pdf, headers, rows, [25, 30, 20, 55, 25])


def _render_maintenance_summary(pdf: FPDF, content: Dict[str, Any]):
    _section_heading(pdf, "Maintenance Overview")
    _stat_line(pdf, "Total Work Orders", content.get("total_work_orders", 0))
    _stat_line(pdf, "Avg Completion Time", f"{content.get('avg_completion_time_hours', 0)}h")
    _stat_line(pdf, "Total Labor Hours", content.get("total_labor_hours", 0))
    _stat_line(pdf, "Parts on Order", content.get("parts_on_order", 0))

    wo_counts = content.get("work_order_counts", {})
    if wo_counts:
        _section_heading(pdf, "Work Order Status Breakdown")
        for status, count in wo_counts.items():
            _stat_line(pdf, _status_str(status), count)

    top_issues = content.get("top_issues", [])
    if top_issues:
        _section_heading(pdf, "Top Maintenance Issues")
        headers = ["EQUIPMENT TYPE", "OPEN WOs"]
        rows = [[i.get("equipment_type", ""), str(i.get("open_work_orders", 0))] for i in top_issues]
        _add_table(pdf, headers, rows, [100, 40])


def _render_movement_summary(pdf: FPDF, content: Dict[str, Any]):
    _section_heading(pdf, "Movement Overview")
    _stat_line(pdf, "Total Movements", content.get("total_movements", 0))
    _stat_line(pdf, "Vehicles in Transit", content.get("total_vehicles_in_transit", 0))
    _stat_line(pdf, "Personnel in Transit", content.get("total_personnel_in_transit", 0))

    sc = content.get("status_counts", {})
    if sc:
        _section_heading(pdf, "Movement Status Breakdown")
        for status, count in sc.items():
            _stat_line(pdf, _status_str(status), count)

    completions = content.get("recent_completions", [])
    if completions:
        _section_heading(pdf, "Recent Completions")
        headers = ["CONVOY", "ORIGIN", "DESTINATION", "VEHICLES", "ARRIVAL"]
        rows = [
            [
                c.get("convoy_id") or "N/A",
                c.get("origin", ""),
                c.get("destination", ""),
                str(c.get("vehicle_count", 0)),
                _format_dt(c.get("arrival")),
            ]
            for c in completions
        ]
        _add_table(pdf, headers, rows, [30, 35, 35, 25, 35])


def _render_personnel_strength(pdf: FPDF, content: Dict[str, Any]):
    _section_heading(pdf, "Personnel Overview")
    _stat_line(pdf, "Total Assigned", content.get("total_assigned", 0))
    _stat_line(pdf, "Total Active", content.get("total_active", 0))
    inactive = (content.get("total_assigned", 0) or 0) - (content.get("total_active", 0) or 0)
    _stat_line(pdf, "Inactive", inactive)

    sb = content.get("status_breakdown", {})
    if sb:
        _section_heading(pdf, "Status Breakdown")
        for status, count in sb.items():
            _stat_line(pdf, _status_str(status), count)

    rb = content.get("rank_breakdown", {})
    if rb:
        _section_heading(pdf, "By Rank")
        headers = ["RANK", "COUNT"]
        rows = sorted([[r, str(c)] for r, c in rb.items()], key=lambda x: int(x[1]), reverse=True)
        _add_table(pdf, headers, rows, [80, 40])

    mb = content.get("mos_breakdown", {})
    if mb:
        _section_heading(pdf, "By MOS")
        headers = ["MOS", "COUNT"]
        rows = sorted([[m, str(c)] for m, c in mb.items()], key=lambda x: int(x[1]), reverse=True)
        _add_table(pdf, headers, rows, [80, 40])


def _render_generic(pdf: FPDF, content: Dict[str, Any]):
    """Fallback renderer: dump all key-value pairs."""
    _section_heading(pdf, "Report Data")
    skip_keys = {"report_type", "unit", "generated_at", "dtg", "as_of", "period_start", "period_end"}
    for key, val in content.items():
        if key in skip_keys:
            continue
        if isinstance(val, (dict, list)):
            _stat_line(pdf, key.replace("_", " ").title(), json.dumps(val, default=str)[:200])
        else:
            _stat_line(pdf, key.replace("_", " ").title(), str(val))


_RENDERERS = {
    "LOGSTAT": _render_logstat,
    "READINESS": _render_readiness,
    "SUPPLY_STATUS": _render_supply_status,
    "EQUIPMENT_STATUS": _render_equipment_status,
    "MAINTENANCE_SUMMARY": _render_maintenance_summary,
    "MOVEMENT_SUMMARY": _render_movement_summary,
    "PERSONNEL_STRENGTH": _render_personnel_strength,
}
