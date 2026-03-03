"""Excel template definitions for known LOGSTAT and supply formats."""

from typing import Dict, List, Optional, Tuple

# Known column header patterns for LOGSTAT Excel templates
LOGSTAT_TEMPLATES = {
    "standard_logstat": {
        "description": "Standard USMC LOGSTAT template",
        "required_headers": ["UNIT", "CLASS", "ITEM", "ON HAND", "AUTH", "DOS"],
        "column_map": {
            "UNIT": "unit",
            "CLASS": "supply_class",
            "ITEM": "item_description",
            "ON HAND": "on_hand_qty",
            "AUTH": "required_qty",
            "AUTHORIZED": "required_qty",
            "DOS": "dos",
            "DAYS OF SUPPLY": "dos",
            "STATUS": "status",
            "CONSUMPTION RATE": "consumption_rate",
            "RATE": "consumption_rate",
        },
    },
    "equipment_readiness": {
        "description": "Equipment readiness report template",
        "required_headers": ["UNIT", "TAMCN", "NOMENCLATURE", "POSS", "MC"],
        "column_map": {
            "UNIT": "unit",
            "TAMCN": "tamcn",
            "NOMENCLATURE": "nomenclature",
            "POSS": "total_possessed",
            "POSSESSED": "total_possessed",
            "MC": "mission_capable",
            "MISSION CAPABLE": "mission_capable",
            "NMCM": "nmcm",
            "NMCS": "nmcs",
            "READINESS": "readiness_pct",
            "READINESS %": "readiness_pct",
            "% MC": "readiness_pct",
        },
    },
    "movement_tracker": {
        "description": "Convoy/movement tracking template",
        "required_headers": ["CONVOY", "ORIGIN", "DESTINATION"],
        "column_map": {
            "CONVOY": "convoy_id",
            "CONVOY ID": "convoy_id",
            "ORIGIN": "origin",
            "FROM": "origin",
            "DESTINATION": "destination",
            "DEST": "destination",
            "TO": "destination",
            "DEPARTURE": "departure_time",
            "DEP TIME": "departure_time",
            "ETA": "eta",
            "ARRIVAL": "actual_arrival",
            "VEHICLES": "vehicle_count",
            "VEH": "vehicle_count",
            "CARGO": "cargo_description",
            "STATUS": "status",
            "UNIT": "unit",
        },
    },
}


def identify_template(headers: List[str]) -> Optional[Tuple[str, Dict]]:
    """Identify which template matches the given column headers.

    Returns (template_name, template_config) or None if no match.
    """
    normalized_headers = [h.strip().upper() for h in headers if h]

    best_match = None
    best_score = 0

    for template_name, template_config in LOGSTAT_TEMPLATES.items():
        required = template_config["required_headers"]
        matches = sum(
            1 for req in required if any(req in header for header in normalized_headers)
        )

        score = matches / len(required)
        if score > best_score and score >= 0.5:
            best_score = score
            best_match = (template_name, template_config)

    return best_match


def map_columns(headers: List[str], template_config: Dict) -> Dict[int, str]:
    """Map column indices to standardized field names.

    Returns {column_index: field_name} mapping.
    """
    column_map = template_config["column_map"]
    mapping = {}

    for idx, header in enumerate(headers):
        if not header:
            continue
        normalized = header.strip().upper()
        if normalized in column_map:
            mapping[idx] = column_map[normalized]
        else:
            # Partial match
            for pattern, field in column_map.items():
                if pattern in normalized:
                    mapping[idx] = field
                    break

    return mapping
