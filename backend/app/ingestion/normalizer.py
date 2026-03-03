"""Normalize raw parsed records into a standard schema."""

import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.models.raw_data import SourceType
from app.models.supply import SupplyClass, SupplyStatus


# Supply class normalization map
_SUPPLY_CLASS_MAP = {
    "I": SupplyClass.I,
    "1": SupplyClass.I,
    "II": SupplyClass.II,
    "2": SupplyClass.II,
    "III": SupplyClass.III,
    "3": SupplyClass.III,
    "IV": SupplyClass.IV,
    "4": SupplyClass.IV,
    "V": SupplyClass.V,
    "5": SupplyClass.V,
    "VI": SupplyClass.VI,
    "6": SupplyClass.VI,
    "VII": SupplyClass.VII,
    "7": SupplyClass.VII,
    "VIII": SupplyClass.VIII,
    "8": SupplyClass.VIII,
    "IX": SupplyClass.IX,
    "9": SupplyClass.IX,
    "X": SupplyClass.X,
    "10": SupplyClass.X,
}

# Unit abbreviation normalization
_UNIT_ABBREV_MAP = {
    "1/1": "1st Bn 1st Marines",
    "2/1": "2nd Bn 1st Marines",
    "3/1": "3rd Bn 1st Marines",
    "1ST MARDIV": "1st Marine Division",
    "1ST MAR": "1st Marines",
    "I MEF": "I MEF",
    "CLR-1": "CLR-1",
    "CLB-1": "CLB-1",
}

# DTG (Date-Time Group) parsing pattern
_DTG_PATTERN = re.compile(r"(\d{2})(\d{2})(\d{2})Z(\w{3})(\d{2})")

_MONTH_MAP = {
    "JAN": 1,
    "FEB": 2,
    "MAR": 3,
    "APR": 4,
    "MAY": 5,
    "JUN": 6,
    "JUL": 7,
    "AUG": 8,
    "SEP": 9,
    "OCT": 10,
    "NOV": 11,
    "DEC": 12,
}


def normalize_supply_class(value: Any) -> Optional[SupplyClass]:
    """Normalize a supply class string to the enum."""
    if isinstance(value, SupplyClass):
        return value
    s = str(value).strip().upper()
    return _SUPPLY_CLASS_MAP.get(s)


def normalize_dtg(dtg_str: str) -> Optional[datetime]:
    """Parse a military Date-Time Group string into a datetime."""
    match = _DTG_PATTERN.match(dtg_str.strip())
    if not match:
        return None

    day = int(match.group(1))
    hour = int(match.group(2))
    minute = int(match.group(3))
    month_str = match.group(4).upper()
    year_short = int(match.group(5))

    month = _MONTH_MAP.get(month_str)
    if not month:
        return None

    year = 2000 + year_short
    try:
        return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
    except ValueError:
        return None


def normalize_quantity(value: Any) -> float:
    """Normalize a quantity value to a float."""
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "").replace("%", "")
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0


def normalize_unit_name(name: str) -> str:
    """Normalize a unit name/abbreviation."""
    upper = name.strip().upper()
    return _UNIT_ABBREV_MAP.get(upper, name.strip())


def determine_status(on_hand: float, required: float, dos: float) -> SupplyStatus:
    """Determine supply status from quantities."""
    if dos < 3:
        return SupplyStatus.RED
    elif dos < 5:
        return SupplyStatus.AMBER
    else:
        return SupplyStatus.GREEN


def normalize_record(raw_record: Dict, source_type: SourceType) -> Dict:
    """Normalize a raw parsed record into a standardized format.

    Standardizes units, dates, supply class names, and unit abbreviations.
    """
    record_type = raw_record.get("type", "UNKNOWN")
    data = raw_record.get("data", {})
    normalized = {
        "type": record_type,
        "source_type": source_type.value,
        "confidence": raw_record.get("confidence", 0.0),
    }

    if record_type == "SUPPLY":
        on_hand = normalize_quantity(data.get("on_hand_qty", 0))
        required = normalize_quantity(data.get("required_qty", 0))
        dos = normalize_quantity(data.get("dos", 0))

        normalized.update(
            {
                "supply_class": normalize_supply_class(data.get("supply_class")),
                "item_description": str(data.get("item_description", "")).strip(),
                "on_hand_qty": on_hand,
                "required_qty": required,
                "dos": dos,
                "consumption_rate": normalize_quantity(data.get("consumption_rate", 0)),
                "status": determine_status(on_hand, required, dos).value,
            }
        )

        if "logstat_unit" in data:
            normalized["unit_name"] = normalize_unit_name(data["logstat_unit"])
        if "logstat_dtg" in data:
            normalized["reported_at"] = normalize_dtg(data["logstat_dtg"])

    elif record_type == "EQUIPMENT":
        mc = normalize_quantity(data.get("mission_capable", 0))
        total = normalize_quantity(data.get("total_possessed", 0))

        normalized.update(
            {
                "tamcn": str(data.get("tamcn", "")).strip(),
                "nomenclature": str(data.get("nomenclature", "")).strip(),
                "total_possessed": int(total),
                "mission_capable": int(mc),
                "not_mission_capable_maintenance": int(
                    normalize_quantity(data.get("nmcm", 0))
                ),
                "not_mission_capable_supply": int(
                    normalize_quantity(data.get("nmcs", 0))
                ),
                "readiness_pct": normalize_quantity(data.get("readiness_pct", 0)),
            }
        )

    elif record_type == "TRANSPORTATION":
        normalized.update(
            {
                "convoy_id": str(data.get("convoy_id", "")).strip(),
                "origin": str(data.get("origin", "")).strip(),
                "destination": str(data.get("destination", "")).strip(),
                "vehicle_count": int(normalize_quantity(data.get("vehicle_count", 0))),
                "eta": data.get("eta"),
            }
        )

    elif record_type == "LOGSTAT_HEADER":
        if "dtg" in data:
            normalized["reported_at"] = normalize_dtg(data["dtg"])
        normalized["unit_name"] = normalize_unit_name(data.get("unit", ""))
        normalized["sender"] = data.get("sender", "")

    else:
        # Pass through unknown types
        normalized["data"] = data

    return normalized
