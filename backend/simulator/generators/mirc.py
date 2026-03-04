"""mIRC log content generator for the KEYSTONE simulator.

Generates realistic mIRC channel log content whose structured messages
exactly match the regex patterns defined in
``app.ingestion.mirc_patterns`` (LOGSTAT headers, supply lines, supply
requests, convoy updates, equipment status).  Non-parseable "chatter"
messages are interspersed for realism.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from simulator.units import CALLSIGNS, SCENARIO_CHANNELS

if TYPE_CHECKING:
    from simulator.units import UnitState

# Month abbreviations for DTG formatting
_MONTH_ABBR = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
]

# Supply class to roman-numeral string
_CLASS_ROMAN = {
    "I": "I",
    "II": "II",
    "III": "III",
    "IV": "IV",
    "V": "V",
    "VI": "VI",
    "VII": "VII",
    "VIII": "VIII",
    "IX": "IX",
    "X": "X",
}

# Unit-of-measure tags used in supply requests (for the regex optional group)
_UOM_TAGS: dict[str, str] = {
    "MRE": "EACH",
    "WATER": "GAL",
    "JP-8": "GAL",
    "DIESEL": "GAL",
    "MOGAS": "GAL",
    "5.56MM BALL": "RDS",
    "7.62MM BALL": "RDS",
    "40MM HE": "RDS",
    ".50 CAL": "RDS",
    "81MM HE": "RDS",
    "AT-4": "EACH",
    "CLS BAGS": "EACH",
    "BLOOD PRODUCTS": "UNITS",
    "IV FLUIDS": "EACH",
    "BATTERIES": "EACH",
}

# ---------------------------------------------------------------------------
# Chatter templates  (>= 15)
# ---------------------------------------------------------------------------

CHATTER_TEMPLATES: list[str] = [
    "Roger, tracking. Will push that to S4.",
    "Copy all. WILCO.",
    "Negative, we are still waiting on the resupply convoy.",
    "Good copy on the LOGSTAT. Any change to CL V status?",
    "Roger, we'll have updated numbers at next reporting window.",
    "Standing by for guidance from higher.",
    "WILCO. Pushing the updated figures now.",
    "Negative contact on that last resupply. Request status update.",
    "Copy. Be advised, MSR BRONZE is currently black due to IED threat.",
    "Roger, understood. Will adjust convoy route accordingly.",
    "All stations, be advised maintenance recovery team is inbound your pos.",
    "Copy, we need an updated equipment readiness by 1600Z.",
    "Solid copy. S4 is tracking the shortfall.",
    "Roger, priority resupply is CL III and CL V at this time.",
    "Good copy. Will relay to the CO.",
    "Negative, no change to current posture. Continue to report as scheduled.",
    "Roger. Be advised, water point at grid 34S is operational.",
    "Copy all. Resupply convoy should arrive NLT 1800Z.",
    "Break — any station this net, confirm receipt of last LOGSTAT.",
    "WILCO. Passing to higher for action.",
    "Roger, we're amber on CL I. Requesting emergency resupply.",
    "Copy. Maintenance contact team is 30 mikes out.",
]

# Convoy locations used in movement messages
_CONVOY_LOCATIONS = [
    "CSS AREA",
    "CAMP WILSON",
    "FOB BULLRUSH",
    "CAMP PENDLETON",
    "LZ ROBIN",
    "MSR BRONZE CP1",
    "SUPPLY POINT ALPHA",
    "MAINSIDE",
    "COMBAT TOWN",
    "RANGE 400",
]

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def format_dtg(dt: datetime) -> str:
    """Format a datetime as a military Date-Time Group.

    Returns a string like ``010830ZMAR26`` (DDHHMMZMMMYY).
    """
    month = _MONTH_ABBR[dt.month - 1]
    return f"{dt.day:02d}{dt.hour:02d}{dt.minute:02d}Z{month}{dt.strftime('%y')}"


def _fmt_time(dt: datetime) -> str:
    """Format HH:MM:SS for mIRC timestamp brackets."""
    return dt.strftime("%H:%M:%S")


def _get_callsign(unit: "UnitState") -> str:
    """Get a random callsign for a unit."""
    callsigns = CALLSIGNS.get(unit.abbreviation, unit.callsigns)
    if not callsigns:
        return unit.abbreviation.upper().replace(" ", "-")
    return random.choice(callsigns)


def _callsign_for(unit: "UnitState", role: str = "LOG") -> str:
    """Pick the callsign matching *role* for a unit, or a random one."""
    pool = CALLSIGNS.get(unit.abbreviation, unit.callsigns or [])
    for cs in pool:
        if cs.endswith(f"-{role}"):
            return cs
    return pool[0] if pool else unit.abbreviation.upper().replace(" ", "-")


def _line(ts: datetime, sender: str, text: str) -> str:
    """Format a single mIRC line: ``[HH:MM:SS] <SENDER> text``."""
    return f"[{_fmt_time(ts)}] <{sender}> {text}"


# ---------------------------------------------------------------------------
# Structured message generators
# ---------------------------------------------------------------------------


def generate_logstat_block(unit: UnitState, timestamp: datetime) -> list[str]:
    """Generate a full LOGSTAT block (header + one line per supply item).

    Each line is a complete mIRC-formatted string.  The timestamps are
    incremented by 1 second per line so they appear sequential.

    Args:
        unit: The unit whose supply state to report.
        timestamp: Base timestamp for the block (header line).

    Returns:
        List of formatted mIRC log lines.
    """
    sender = _callsign_for(unit, "LOG")
    dtg = format_dtg(timestamp)
    lines: list[str] = []

    # Header line
    lines.append(_line(timestamp, sender, f"LOGSTAT AS OF {dtg} // {unit.unit_name}"))

    # Supply lines — one per item, timestamps increment by 1s
    for idx, item in enumerate(unit.supply_items, start=1):
        ts = timestamp + timedelta(seconds=idx)
        class_roman = _CLASS_ROMAN.get(item.supply_class, item.supply_class)
        on_hand = int(item.on_hand)
        required = int(item.required)
        pct = round(item.percentage, 1)
        dos = round(item.dos, 1)
        text = (
            f"CL {class_roman}: {item.name} {on_hand} ON HAND / "
            f"{required} AUTH / {pct}% / {dos} DOS"
        )
        lines.append(_line(ts, sender, text))

    return lines


def generate_supply_request(unit: UnitState, timestamp: datetime) -> str:
    """Generate a single supply request mIRC line.

    Picks a random supply item that is below 80 % fill, or any item if
    all are above threshold.

    Args:
        unit: Requesting unit.
        timestamp: Message timestamp.

    Returns:
        Formatted mIRC log line.
    """
    sender = _callsign_for(unit, "4")

    # Prefer items below threshold
    low_items = [i for i in unit.supply_items if i.percentage < 80.0]
    item = random.choice(low_items) if low_items else random.choice(unit.supply_items)

    # Request quantity: enough to bring back to ~90 % of required
    shortfall = max(1, int(item.required * 0.9) - int(item.on_hand))
    # Round up to a nice number
    shortfall = int(round(shortfall / 10) * 10) or 10

    class_roman = _CLASS_ROMAN.get(item.supply_class, item.supply_class)
    uom = _UOM_TAGS.get(item.name.upper(), "EACH")

    text = (
        f"REQUEST CL {class_roman} {item.name} {shortfall} {uom} FOR {unit.unit_name}"
    )
    return _line(timestamp, sender, text)


def generate_convoy_update(convoy_data: dict, timestamp: datetime) -> str:
    """Generate a convoy movement update mIRC line.

    Args:
        convoy_data: Dict with keys ``convoy_id``, ``origin``,
            ``destination``, ``eta`` (HHMMZ str), ``vehicle_count``.
        timestamp: Message timestamp.

    Returns:
        Formatted mIRC log line.
    """
    sender = "IRONHORSE-DISTRO"
    cid = convoy_data.get("convoy_id", "C-2026-001")
    origin = convoy_data.get("origin", "CSS AREA")
    dest = convoy_data.get("destination", "CAMP WILSON")
    eta = convoy_data.get("eta", "1200Z")
    veh = convoy_data.get("vehicle_count", 8)

    text = f"CONVOY {cid} DEP {origin} EN ROUTE {dest} ETA {eta} {veh} VEH"
    return _line(timestamp, sender, text)


def generate_equipment_status(unit: UnitState, timestamp: datetime) -> str:
    """Generate an equipment status mIRC line for a random equipment category.

    Matches the EQUIP_STATUS regex:
    ``NOMENCLATURE TAMCN MC/TOTAL MC NMCM NMCS PCT%``

    Args:
        unit: Unit whose equipment to report.
        timestamp: Message timestamp.

    Returns:
        Formatted mIRC log line.
    """
    if not unit.equipment_categories:
        return ""

    cat = random.choice(unit.equipment_categories)
    sender = _callsign_for(unit, "LOG")

    mc = cat.mission_capable
    total = cat.total_possessed
    nmcm = cat.nmcm
    nmcs = cat.nmcs
    pct = int(round(cat.readiness_pct))

    text = (
        f"{cat.nomenclature} {cat.tamcn} {mc}/{total} MC {nmcm} NMCM {nmcs} NMCS {pct}%"
    )
    return _line(timestamp, sender, text)


def generate_chatter(
    channel: str,
    timestamp: datetime,
    units: list[UnitState],
) -> str:
    """Generate a non-parseable chatter message for realism.

    Args:
        channel: The mIRC channel name (used for context but not in output).
        timestamp: Message timestamp.
        units: Available units whose callsigns may be used as sender.

    Returns:
        Formatted mIRC log line.
    """
    # Pick a random callsign from available units
    all_cs: list[str] = []
    for u in units:
        pool = CALLSIGNS.get(u.abbreviation, u.callsigns or [])
        all_cs.extend(pool)
    if not all_cs:
        all_cs = ["UNKNOWN-4"]

    sender = random.choice(all_cs)
    text = random.choice(CHATTER_TEMPLATES)
    return _line(timestamp, sender, text)


# ---------------------------------------------------------------------------
# Batch generator
# ---------------------------------------------------------------------------


def generate_mirc_log_batch(
    channel: str,
    units: list[UnitState],
    window_start: datetime,
    window_end: datetime,
    scenario_name: str = "steel_guardian",
) -> str:
    """Generate a batch of mIRC messages for a time window.

    Produces a mix of structured (parseable) and chatter messages
    appropriate for the given channel type. Uses scenario-specific
    channel configuration from ``simulator.units.SCENARIO_CHANNELS``.

    Args:
        channel: mIRC channel name (e.g. ``#1-1-LOG-NET``).
        units: List of unit states to draw data from.
        window_start: Start of the time window.
        window_end: End of the time window.
        scenario_name: Scenario name for channel config lookup.

    Returns:
        Multi-line string of formatted mIRC log text.
    """
    # Look up channel config from scenario-specific channels
    channels = SCENARIO_CHANNELS.get(scenario_name, {})
    channel_cfg = channels.get(channel, {})
    content_type = channel_cfg.get("content", "logistics")
    channel_units_abbrs = channel_cfg.get("units", [])

    # Determine message types based on content type
    if content_type == "logistics":
        msg_types = ["logstat", "supply_request", "chatter"]
    elif content_type == "maintenance":
        msg_types = ["equipment", "chatter"]
    elif content_type == "supply_requests":
        msg_types = ["supply_request", "chatter"]
    elif content_type == "distribution":
        msg_types = ["convoy", "chatter"]
    elif content_type == "fires_support":
        msg_types = ["chatter"]
    elif content_type == "aviation_ops":
        msg_types = ["chatter"]
    elif content_type == "recon_ops":
        msg_types = ["chatter"]
    else:
        msg_types = ["logstat", "supply_request", "chatter"]

    # Filter units to those on this channel
    relevant_units = [u for u in units if u.abbreviation in channel_units_abbrs]
    if not relevant_units:
        relevant_units = units  # fallback

    lines: list[str] = []
    window_seconds = max(1, int((window_end - window_start).total_seconds()))

    # Determine how many messages to generate
    # ~2-5 messages per minute for active channels
    minutes = max(1, window_seconds // 60)
    msg_count = random.randint(minutes * 2, minutes * 5)
    msg_count = min(msg_count, 200)  # cap

    # Generate sorted random timestamps within the window
    offsets = sorted(random.randint(0, window_seconds) for _ in range(msg_count))

    for offset in offsets:
        ts = window_start + timedelta(seconds=offset)
        unit = random.choice(relevant_units)
        msg_type = random.choice(msg_types)

        if msg_type == "logstat":
            block = generate_logstat_block(unit, ts)
            lines.extend(block)

        elif msg_type == "supply_request":
            if unit.supply_items:
                lines.append(generate_supply_request(unit, ts))
            else:
                lines.append(generate_chatter(channel, ts, relevant_units))

        elif msg_type == "convoy":
            convoy = _random_convoy_data(ts)
            lines.append(generate_convoy_update(convoy, ts))

        elif msg_type == "equipment":
            line = generate_equipment_status(unit, ts)
            if line:
                lines.append(line)
            else:
                lines.append(generate_chatter(channel, ts, relevant_units))

        else:
            lines.append(generate_chatter(channel, ts, relevant_units))

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _random_convoy_data(ts: datetime) -> dict:
    """Build a random convoy_data dict for convoy message generation."""
    origin = random.choice(_CONVOY_LOCATIONS)
    dest = random.choice([loc for loc in _CONVOY_LOCATIONS if loc != origin])
    eta_hour = (ts.hour + random.randint(1, 4)) % 24
    eta_min = random.choice([0, 15, 30, 45])
    convoy_num = random.randint(1, 99)
    return {
        "convoy_id": f"C-{ts.year}-{convoy_num:03d}",
        "origin": origin,
        "destination": dest,
        "eta": f"{eta_hour:02d}{eta_min:02d}Z",
        "vehicle_count": random.randint(4, 20),
    }
