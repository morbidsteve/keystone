"""Parse CoT (Cursor on Target) XML messages into KEYSTONE data structures.

CoT is the standard messaging protocol used by TAK (Team Awareness Kit).
Each CoT message is an XML event containing position, identity, and
optional detail data. This module extracts logistics-relevant information
from CoT messages for ingestion into KEYSTONE.
"""

import re
import defusedxml.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from xml.etree.ElementTree import Element


# CoT type taxonomy prefixes
# a-f-G-* = friendly ground units
# a-f-A-* = friendly air
# b-r-*   = route/movement
# b-m-p-s-p-loc   = supply point
# b-m-p-s-p-loc-e = equipment cache
# a-f-G-U-C-I     = friendly ground unit combat infantry
_COT_CATEGORY_MAP = {
    "a-f-G": "FRIENDLY_GROUND",
    "a-f-A": "FRIENDLY_AIR",
    "a-f-S": "FRIENDLY_SEA",
    "a-h-G": "HOSTILE_GROUND",
    "a-n-G": "NEUTRAL_GROUND",
    "a-u-G": "UNKNOWN_GROUND",
    "b-r": "ROUTE",
    "b-m-p-s-p-loc": "SUPPLY_POINT",
    "b-m-p-s-p-loc-e": "EQUIPMENT_CACHE",
    "b-m-p-w": "WAYPOINT",
    "b-m-p-c": "CHECKPOINT",
}


def parse_cot_message(xml_content: str) -> Optional[Dict[str, Any]]:
    """Parse a CoT XML message into a structured dictionary.

    CoT format:
    <event version="2.0" uid="unique-id" type="a-f-G-U-C-I"
           time="2026-03-03T12:00:00Z" start="..." stale="..."
           how="h-g-i-g-o">
        <point lat="33.3" lon="-117.4" hae="100" ce="10" le="5"/>
        <detail>
            <contact callsign="ALPHA-6"/>
            <remarks>Supply status report...</remarks>
            <__group name="1st Marines" role="Team Lead"/>
            <logistics>
                <supply class="I" onhand="2400" auth="3000" dos="2.1"/>
                <supply class="III" onhand="4500" auth="8000" dos="1.8"/>
                <equipment tamcn="HMMWV" mc="42" total="48"/>
            </logistics>
        </detail>
    </event>

    Args:
        xml_content: Raw XML string containing a CoT event message.

    Returns:
        Parsed dictionary with extracted data, or None if parsing fails.
    """
    try:
        # Strip any BOM or whitespace
        xml_content = xml_content.strip()
        if not xml_content:
            return None

        root = ET.fromstring(xml_content)
    except ET.ParseError:
        return None

    if root.tag != "event":
        return None

    # Extract top-level event attributes
    uid = root.get("uid", "")
    cot_type = root.get("type", "")
    event_time = _parse_cot_timestamp(root.get("time"))
    start_time = _parse_cot_timestamp(root.get("start"))
    stale_time = _parse_cot_timestamp(root.get("stale"))
    how = root.get("how", "")

    result: Dict[str, Any] = {
        "uid": uid,
        "cot_type": cot_type,
        "category": classify_cot_type(cot_type),
        "event_time": event_time.isoformat() if event_time else None,
        "start_time": start_time.isoformat() if start_time else None,
        "stale_time": stale_time.isoformat() if stale_time else None,
        "how": how,
        "position": None,
        "callsign": None,
        "group_name": None,
        "group_role": None,
        "remarks": None,
        "logistics": [],
        "equipment": [],
        "raw_xml": xml_content,
    }

    # Extract point (position)
    point_elem = root.find("point")
    if point_elem is not None:
        result["position"] = {
            "lat": _safe_float(point_elem.get("lat")),
            "lon": _safe_float(point_elem.get("lon")),
            "hae": _safe_float(point_elem.get("hae")),  # height above ellipsoid
            "ce": _safe_float(point_elem.get("ce")),  # circular error
            "le": _safe_float(point_elem.get("le")),  # linear error
        }

    # Extract detail elements
    detail_elem = root.find("detail")
    if detail_elem is not None:
        # Contact / callsign
        contact = detail_elem.find("contact")
        if contact is not None:
            result["callsign"] = contact.get("callsign")

        # Group info
        group = detail_elem.find("__group")
        if group is not None:
            result["group_name"] = group.get("name")
            result["group_role"] = group.get("role")

        # Remarks (may contain free-text logistics data)
        remarks = detail_elem.find("remarks")
        if remarks is not None and remarks.text:
            result["remarks"] = remarks.text.strip()

        # Custom logistics detail elements
        logistics_data = extract_logistics_data(detail_elem)
        if logistics_data:
            result["logistics"] = logistics_data["supply_items"]
            result["equipment"] = logistics_data["equipment_items"]

    return result


def classify_cot_type(cot_type: str) -> str:
    """Classify a CoT type code into a KEYSTONE data category.

    CoT type taxonomy uses a dotted hierarchy:
    a-f-G-U-C-I = atom-affiliation-dimension-entity-type-subtype

    Affiliation: f=friendly, h=hostile, n=neutral, u=unknown
    Dimension: G=ground, A=air, S=sea/surface

    Args:
        cot_type: CoT type string (e.g., "a-f-G-U-C-I").

    Returns:
        KEYSTONE category string (e.g., "FRIENDLY_GROUND").
    """
    if not cot_type:
        return "UNKNOWN"

    # Try longest prefix match first
    for prefix in sorted(_COT_CATEGORY_MAP.keys(), key=len, reverse=True):
        if cot_type.startswith(prefix):
            return _COT_CATEGORY_MAP[prefix]

    # Fallback categorizations based on first characters
    if cot_type.startswith("a-"):
        return "UNIT"
    if cot_type.startswith("b-"):
        return "TACTICAL_GRAPHIC"

    return "UNKNOWN"


def extract_logistics_data(detail_element: Element) -> Optional[Dict[str, List]]:
    """Extract structured logistics data from a CoT detail element.

    Looks for custom <logistics> elements containing supply and equipment
    status data in the format used by KEYSTONE-compatible TAK plugins.

    Args:
        detail_element: The <detail> XML element from a CoT message.

    Returns:
        Dictionary with 'supply_items' and 'equipment_items' lists, or None.
    """
    logistics_elem = detail_element.find("logistics")
    if logistics_elem is None:
        return None

    supply_items = []
    equipment_items = []

    # Parse <supply> elements
    for supply in logistics_elem.findall("supply"):
        supply_class = supply.get("class", "")
        item = {
            "supply_class": supply_class,
            "on_hand": _safe_float(supply.get("onhand")),
            "authorized": _safe_float(supply.get("auth")),
            "dos": _safe_float(supply.get("dos")),
            "required": _safe_float(supply.get("required")),
            "item_description": supply.get("desc", f"Class {supply_class} Supply"),
        }
        supply_items.append(item)

    # Parse <equipment> elements
    for equip in logistics_elem.findall("equipment"):
        mc_count = _safe_int(equip.get("mc"))
        total_count = _safe_int(equip.get("total"))
        nmc_count = _safe_int(equip.get("nmc"))
        item = {
            "tamcn": equip.get("tamcn", ""),
            "nomenclature": equip.get("nomen", equip.get("tamcn", "")),
            "mission_capable": mc_count,
            "total": total_count,
            "not_mission_capable": nmc_count,
        }
        # Calculate readiness if we have the data
        if total_count > 0:
            item["readiness_pct"] = round(
                (mc_count / total_count) * 100, 1
            )
        else:
            item["readiness_pct"] = 0.0
        equipment_items.append(item)

    if not supply_items and not equipment_items:
        return None

    return {
        "supply_items": supply_items,
        "equipment_items": equipment_items,
    }


def matches_cot_filter(cot_type: str, filters: List[str]) -> bool:
    """Check if a CoT type matches any of the configured filter patterns.

    Filters are regex patterns (e.g., "a-f-G-.*" matches all friendly ground).

    Args:
        cot_type: The CoT type string to check.
        filters: List of regex patterns to match against.

    Returns:
        True if the CoT type matches at least one filter pattern.
        If filters is empty, returns True (match all).
    """
    if not filters:
        return True

    for pattern in filters:
        try:
            if re.match(pattern, cot_type):
                return True
        except re.error:
            # Invalid regex pattern; skip it
            continue

    return False


def _parse_cot_timestamp(ts: Optional[str]) -> Optional[datetime]:
    """Parse a CoT timestamp string into a datetime object.

    CoT uses ISO 8601 format: 2026-03-03T12:00:00Z or 2026-03-03T12:00:00.000Z
    """
    if not ts:
        return None

    formats = [
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(ts, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue

    return None


def _safe_float(value: Optional[str]) -> float:
    """Safely convert a string to float, returning 0.0 on failure."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def _safe_int(value: Optional[str]) -> int:
    """Safely convert a string to int, returning 0 on failure."""
    if value is None:
        return 0
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 0
