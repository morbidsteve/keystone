"""Regex patterns for parsing mIRC logistics messages."""

import re
from typing import Dict, List, Optional, Tuple

# LOGSTAT header line: [HH:MM:SS] <sender> LOGSTAT AS OF 012345ZJAN26 // Unit Name
LOGSTAT_HEADER = re.compile(
    r"\[(\d{2}:\d{2}:\d{2})\]\s*<([^>]+)>\s*LOGSTAT\s+AS\s+OF\s+"
    r"(\d{6}Z\w{3}\d{2})\s*//\s*(.+)",
    re.IGNORECASE,
)

# Supply line: CL III: JP-8 45000 ON HAND / 60000 AUTH / 75.0% / 4.5 DOS
SUPPLY_LINE = re.compile(
    r"CL\s+(I{1,3}|IV|VI{0,3}|IX|X):\s*(.+?)\s+"
    r"(\d+[\d,]*)\s*(?:ON\s+HAND)?\s*/\s*"
    r"(\d+[\d,]*)\s*(?:AUTH)?\s*/\s*"
    r"(\d+(?:\.\d+)?%?)\s*/\s*"
    r"(\d+(?:\.\d+)?)\s*DOS",
    re.IGNORECASE,
)

# Supply request: REQUEST CL V 5.56MM BALL 50000 RDS FOR 1/1
SUPPLY_REQUEST = re.compile(
    r"(?:REQUEST|REQ|NEED)\s+CL\s+(I{1,3}|IV|VI{0,3}|IX|X)\s+"
    r"(.+?)\s+(\d+[\d,]*)\s*(?:EACH|EA|RDS|GAL|LBS|UNITS?)?\s*"
    r"(?:FOR|TO|BY)?\s*(.*)?",
    re.IGNORECASE,
)

# Convoy/movement update: CONVOY C-123 DEP CAMP LEJEUNE EN ROUTE CAMP PENDLETON ETA 1200Z 12 VEH
CONVOY_UPDATE = re.compile(
    r"(?:CONVOY|CVY|MSR)\s+([\w-]+)\s+"
    r"(?:DEP|DEPARTED|DEPARTING|FROM)\s+(.+?)\s+"
    r"(?:EN\s*ROUTE|TO|DEST|DESTINATION)\s+(.+?)\s+"
    r"(?:ETA\s+(\d{4}Z?)\s+)?"
    r"(\d+)\s*(?:VEH|VEHICLE|TRUCKS?|VICS?)",
    re.IGNORECASE,
)

# Equipment status: HMMWV M1151 12/15 MC 2 NMCM 1 NMCS 80%
EQUIP_STATUS = re.compile(
    r"([\w-]+)\s+([\w\d]+)\s+"
    r"(\d+)\s*/\s*(\d+)\s*MC\s+"
    r"(\d+)\s*NMCM\s+"
    r"(\d+)\s*NMCS\s+"
    r"(\d+(?:\.\d+)?)\s*%",
    re.IGNORECASE,
)

# Simple equipment readiness: TAMCN D1234 HMMWV 12/15 80% MC
EQUIP_SIMPLE = re.compile(
    r"(?:TAMCN\s+)?([\w\d]+)\s+"
    r"([\w\s-]+?)\s+"
    r"(\d+)\s*/\s*(\d+)\s+"
    r"(\d+(?:\.\d+)?)\s*%\s*MC",
    re.IGNORECASE,
)


def parse_logstat_header(line: str) -> Optional[Dict]:
    """Parse a LOGSTAT header line."""
    match = LOGSTAT_HEADER.match(line.strip())
    if match:
        return {
            "time": match.group(1),
            "sender": match.group(2),
            "dtg": match.group(3),
            "unit": match.group(4).strip(),
        }
    return None


def parse_supply_line(line: str) -> Optional[Dict]:
    """Parse a supply status line."""
    match = SUPPLY_LINE.search(line.strip())
    if match:
        pct_str = match.group(5).rstrip("%")
        return {
            "type": "SUPPLY",
            "supply_class": match.group(1),
            "item_description": match.group(2).strip(),
            "on_hand_qty": float(match.group(3).replace(",", "")),
            "required_qty": float(match.group(4).replace(",", "")),
            "percentage": float(pct_str),
            "dos": float(match.group(6)),
        }
    return None


def parse_supply_request(line: str) -> Optional[Dict]:
    """Parse a supply request message."""
    match = SUPPLY_REQUEST.search(line.strip())
    if match:
        return {
            "type": "SUPPLY_REQUEST",
            "supply_class": match.group(1),
            "item_description": match.group(2).strip(),
            "quantity": float(match.group(3).replace(",", "")),
            "requesting_unit": match.group(4).strip() if match.group(4) else None,
        }
    return None


def parse_convoy_update(line: str) -> Optional[Dict]:
    """Parse a convoy/movement update."""
    match = CONVOY_UPDATE.search(line.strip())
    if match:
        return {
            "type": "TRANSPORTATION",
            "convoy_id": match.group(1),
            "origin": match.group(2).strip(),
            "destination": match.group(3).strip(),
            "eta": match.group(4) if match.group(4) else None,
            "vehicle_count": int(match.group(5)),
        }
    return None


def parse_equipment_status(line: str) -> Optional[Dict]:
    """Parse an equipment status line."""
    match = EQUIP_STATUS.search(line.strip())
    if match:
        return {
            "type": "EQUIPMENT",
            "nomenclature": match.group(1),
            "tamcn": match.group(2),
            "mission_capable": int(match.group(3)),
            "total_possessed": int(match.group(4)),
            "nmcm": int(match.group(5)),
            "nmcs": int(match.group(6)),
            "readiness_pct": float(match.group(7)),
        }

    # Try simple format
    match = EQUIP_SIMPLE.search(line.strip())
    if match:
        mc = int(match.group(3))
        total = int(match.group(4))
        return {
            "type": "EQUIPMENT",
            "tamcn": match.group(1),
            "nomenclature": match.group(2).strip(),
            "mission_capable": mc,
            "total_possessed": total,
            "nmcm": total - mc,
            "nmcs": 0,
            "readiness_pct": float(match.group(5)),
        }
    return None


# All pattern parsers in priority order
PATTERN_PARSERS = [
    ("LOGSTAT_HEADER", parse_logstat_header),
    ("SUPPLY", parse_supply_line),
    ("SUPPLY_REQUEST", parse_supply_request),
    ("TRANSPORTATION", parse_convoy_update),
    ("EQUIPMENT", parse_equipment_status),
]
