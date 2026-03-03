"""Military logistics constants, thresholds, and utility mappings."""

from app.models.supply import SupplyClass, SupplyStatus

# Full names for supply classes
SUPPLY_CLASS_NAMES: dict[SupplyClass, str] = {
    SupplyClass.I: "Subsistence",
    SupplyClass.II: "Clothing & Individual Equipment",
    SupplyClass.III: "POL (Petroleum, Oils, Lubricants)",
    SupplyClass.IV: "Construction Materials",
    SupplyClass.V: "Ammunition",
    SupplyClass.VI: "Personal Demand Items",
    SupplyClass.VII: "Major End Items",
    SupplyClass.VIII: "Medical Material",
    SupplyClass.IX: "Repair Parts",
    SupplyClass.X: "Non-standard Items",
}

# Status thresholds based on percentage of authorized quantity
STATUS_THRESHOLDS = {
    SupplyStatus.GREEN: 0.70,   # > 70% of auth qty
    SupplyStatus.AMBER: 0.40,   # 40-70% of auth qty
    SupplyStatus.RED: 0.0,      # < 40% of auth qty
}

# Days-of-supply thresholds
DOS_THRESHOLDS = {
    SupplyStatus.GREEN: 5.0,    # > 5 days
    SupplyStatus.AMBER: 3.0,    # 3-5 days
    SupplyStatus.RED: 0.0,      # < 3 days
}

# Equipment readiness thresholds
READINESS_THRESHOLDS = {
    SupplyStatus.GREEN: 90.0,   # > 90%
    SupplyStatus.AMBER: 75.0,   # 75-90%
    SupplyStatus.RED: 0.0,      # < 75%
}


def determine_supply_status_by_qty(on_hand: float, required: float) -> SupplyStatus:
    """Determine supply status based on on-hand vs required quantity."""
    if required <= 0:
        return SupplyStatus.GREEN
    pct = on_hand / required
    if pct > STATUS_THRESHOLDS[SupplyStatus.GREEN]:
        return SupplyStatus.GREEN
    elif pct > STATUS_THRESHOLDS[SupplyStatus.AMBER]:
        return SupplyStatus.AMBER
    else:
        return SupplyStatus.RED


def determine_supply_status_by_dos(dos: float) -> SupplyStatus:
    """Determine supply status based on days-of-supply."""
    if dos > DOS_THRESHOLDS[SupplyStatus.GREEN]:
        return SupplyStatus.GREEN
    elif dos > DOS_THRESHOLDS[SupplyStatus.AMBER]:
        return SupplyStatus.AMBER
    else:
        return SupplyStatus.RED


def determine_readiness_status(readiness_pct: float) -> SupplyStatus:
    """Determine readiness status based on percentage."""
    if readiness_pct > READINESS_THRESHOLDS[SupplyStatus.GREEN]:
        return SupplyStatus.GREEN
    elif readiness_pct > READINESS_THRESHOLDS[SupplyStatus.AMBER]:
        return SupplyStatus.AMBER
    else:
        return SupplyStatus.RED
