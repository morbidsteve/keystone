"""Unit state tracking during simulation.

Every simulated unit (company, battalion, support element) is represented by a
UnitState instance. UnitState owns supply items, equipment categories, convoy
status, and reporting timestamps. Generators and event handlers read and mutate
these objects to drive realistic data output.

Supports the full USMC unit hierarchy imported from seed.seed_units, with
supply/equipment templates by unit type and multi-scenario support.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


class SupplyClass(str, Enum):
    """NATO supply classes tracked by the simulator."""

    I = "I"  # Rations / Water  # noqa: E741
    III = "III"  # POL (fuel)
    V = "V"  # Ammunition
    VIII = "VIII"  # Medical
    IX = "IX"  # Repair parts


@dataclass
class SupplyItem:
    """A single supply line-item tracked for a unit."""

    name: str
    supply_class: SupplyClass
    unit_of_measure: str  # GAL, RDS, EACH, EA, CS, etc.
    on_hand: float
    required: float
    daily_consumption_rate: float
    last_resupply: Optional[datetime] = None

    @property
    def dos(self) -> float:
        """Days of supply remaining at current consumption rate."""
        if self.daily_consumption_rate <= 0:
            return 99.0
        return self.on_hand / self.daily_consumption_rate

    @property
    def status(self) -> str:
        """GREEN / AMBER / RED based on DOS thresholds."""
        if self.dos > 5:
            return "GREEN"
        elif self.dos > 3:
            return "AMBER"
        else:
            return "RED"

    @property
    def percentage(self) -> float:
        """Percentage of required quantity on hand."""
        if self.required <= 0:
            return 100.0
        return (self.on_hand / self.required) * 100.0


@dataclass
class EquipmentItem:
    """A single serialised piece of equipment."""

    tamcn: str
    nomenclature: str
    serial: str
    status: str = "MC"  # MC, NMCM, NMCS
    fault_description: Optional[str] = None
    ecd: Optional[datetime] = None


@dataclass
class EquipmentCategory:
    """Tracks a category of equipment (e.g., all HMMWVs for a unit)."""

    tamcn: str
    nomenclature: str
    total_possessed: int
    items: list[EquipmentItem] = field(default_factory=list)

    @property
    def mission_capable(self) -> int:
        return sum(1 for i in self.items if i.status == "MC")

    @property
    def nmcm(self) -> int:
        return sum(1 for i in self.items if i.status == "NMCM")

    @property
    def nmcs(self) -> int:
        return sum(1 for i in self.items if i.status == "NMCS")

    @property
    def readiness_pct(self) -> float:
        if self.total_possessed == 0:
            return 100.0
        return (self.mission_capable / self.total_possessed) * 100.0


@dataclass
class UnitState:
    """Full mutable state of a single unit during simulation."""

    unit_name: str
    abbreviation: str
    echelon: str  # "BN", "CO", "PLT"
    position: tuple[float, float]  # (lat, lon)
    supply_items: list[SupplyItem] = field(default_factory=list)
    equipment_categories: list[EquipmentCategory] = field(default_factory=list)
    active_convoys: list[dict] = field(default_factory=list)
    last_logstat: Optional[datetime] = None
    last_equip_report: Optional[datetime] = None
    last_mirc_batch: Optional[datetime] = None
    current_tempo: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    callsigns: list[str] = field(default_factory=list)
    channels: list[str] = field(default_factory=list)

    def consume_supplies(self, hours: float) -> None:
        """Consume supplies for *hours* of sim time at current tempo."""
        tempo_mult = {"LOW": 0.5, "MEDIUM": 1.0, "HIGH": 1.5}[self.current_tempo]
        for item in self.supply_items:
            consumed = item.daily_consumption_rate * (hours / 24.0) * tempo_mult
            consumed *= random.uniform(0.8, 1.2)
            item.on_hand = max(0.0, item.on_hand - consumed)

    def resupply(self, supply_class: SupplyClass, amount: float) -> None:
        """Add *amount* to all items matching *supply_class*, capped at 110% of required."""
        for item in self.supply_items:
            if item.supply_class == supply_class:
                item.on_hand = min(item.on_hand + amount, item.required * 1.1)
                item.last_resupply = datetime.now(timezone.utc)

    def logstat_due(self, sim_now: datetime, interval_hours: int = 12) -> bool:
        """Check whether a LOGSTAT report is overdue."""
        if self.last_logstat is None:
            return True
        return (sim_now - self.last_logstat).total_seconds() >= interval_hours * 3600

    def equip_report_due(self, sim_now: datetime, interval_hours: int = 24) -> bool:
        """Check whether an equipment readiness report is overdue."""
        if self.last_equip_report is None:
            return True
        return (
            sim_now - self.last_equip_report
        ).total_seconds() >= interval_hours * 3600

    def mirc_batch_due(self, sim_now: datetime, interval_minutes: int = 30) -> bool:
        """Check whether a mIRC chat batch is overdue."""
        if self.last_mirc_batch is None:
            return True
        return (sim_now - self.last_mirc_batch).total_seconds() >= interval_minutes * 60


# ---------------------------------------------------------------------------
# AO coordinates — imported from areas_of_operation module
# ---------------------------------------------------------------------------

from simulator.areas_of_operation import AO_29_PALMS, SCENARIO_AO  # noqa: E402

# Common faults for equipment breakdown events
COMMON_FAULTS = [
    "Engine overheating -- coolant leak",
    "Transmission failure -- 3rd gear inop",
    "Hydraulic line rupture",
    "Electrical fault -- alternator failure",
    "Flat tire -- sidewall puncture",
    "Brake system failure -- master cylinder",
    "Fuel pump malfunction",
    "Transfer case failure",
    "Steering linkage broken",
    "Battery dead -- will not start",
    "Turret traverse motor burned out",
    "Track thrown -- road wheel damage",
    "Radio mount broken -- cannot secure",
    "Night vision mount cracked",
    "Weapons station hydraulic leak",
]


# ---------------------------------------------------------------------------
# Supply / Equipment templates
# ---------------------------------------------------------------------------


@dataclass
class SupplyTemplate:
    """Defines default supply posture for a unit type."""

    name: str
    supply_class: SupplyClass
    unit_of_measure: str
    required: float
    daily_rate: float


@dataclass
class EquipTemplate:
    """Defines default equipment table for a unit type."""

    tamcn: str
    nomenclature: str
    count: int
    breakdown_rate: float  # daily probability per item


SUPPLY_TEMPLATES: dict[str, list[SupplyTemplate]] = {
    "infantry_company": [
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 900, 300),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 500, 250),
        SupplyTemplate("5.56mm", SupplyClass.V, "RDS", 21000, 1000),
        SupplyTemplate("7.62mm", SupplyClass.V, "RDS", 8000, 400),
        SupplyTemplate("40mm HEDP", SupplyClass.V, "RDS", 600, 50),
        SupplyTemplate("CLS Bags", SupplyClass.VIII, "EACH", 15, 1),
        SupplyTemplate("IV Fluid", SupplyClass.VIII, "EACH", 30, 2),
    ],
    "infantry_battalion": [
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 4500, 1500),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 2500, 1200),
        SupplyTemplate("JP-8", SupplyClass.III, "GAL", 3000, 800),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 5000, 1200),
        SupplyTemplate("MOGAS", SupplyClass.III, "GAL", 500, 100),
        SupplyTemplate("5.56mm", SupplyClass.V, "RDS", 100000, 5000),
        SupplyTemplate("7.62mm", SupplyClass.V, "RDS", 40000, 2000),
        SupplyTemplate("CLS Bags", SupplyClass.VIII, "EACH", 60, 5),
    ],
    "artillery_battalion": [
        SupplyTemplate("155mm HE", SupplyClass.V, "RDS", 2000, 200),
        SupplyTemplate("155mm WP", SupplyClass.V, "RDS", 200, 20),
        SupplyTemplate("155mm ILLUM", SupplyClass.V, "RDS", 400, 40),
        SupplyTemplate("JP-8", SupplyClass.III, "GAL", 2000, 500),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 3000, 700),
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 2000, 600),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 1500, 500),
    ],
    "logistics_battalion": [
        SupplyTemplate("JP-8", SupplyClass.III, "GAL", 50000, 8000),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 30000, 5000),
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 10000, 2000),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 8000, 3000),
        SupplyTemplate("Repair Parts", SupplyClass.IX, "EACH", 500, 20),
    ],
    "recon_battalion": [
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 300, 100),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 200, 100),
        SupplyTemplate("5.56mm", SupplyClass.V, "RDS", 10000, 500),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 1000, 200),
    ],
    "aviation_squadron": [
        SupplyTemplate("JP-5", SupplyClass.III, "GAL", 80000, 15000),
        SupplyTemplate("Countermeasure Flares", SupplyClass.V, "EACH", 500, 50),
        SupplyTemplate("20mm PGU", SupplyClass.V, "RDS", 5000, 200),
    ],
    "mlr_littoral_combat_team": [
        SupplyTemplate("NSM Missiles", SupplyClass.V, "EACH", 8, 0),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 2000, 400),
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 600, 200),
        SupplyTemplate("5.56mm", SupplyClass.V, "RDS", 15000, 500),
    ],
    "mlr_anti_air_battalion": [
        SupplyTemplate("Stinger Missiles", SupplyClass.V, "EACH", 24, 0),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 1500, 300),
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 400, 150),
    ],
    "engineer_battalion": [
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 4000, 1000),
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 1500, 500),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 1000, 400),
        SupplyTemplate("Repair Parts", SupplyClass.IX, "EACH", 300, 15),
    ],
    "meu": [
        SupplyTemplate("MRE", SupplyClass.I, "EACH", 8000, 2500),
        SupplyTemplate("Water", SupplyClass.I, "GAL", 5000, 2000),
        SupplyTemplate("JP-5", SupplyClass.III, "GAL", 100000, 20000),
        SupplyTemplate("Diesel", SupplyClass.III, "GAL", 20000, 4000),
        SupplyTemplate("5.56mm", SupplyClass.V, "RDS", 200000, 10000),
    ],
}

EQUIPMENT_TEMPLATES: dict[str, list[EquipTemplate]] = {
    "infantry_company": [
        EquipTemplate("D1195", "HMMWV M1151", 8, 0.03),
        EquipTemplate("E0846", "JLTV M1280", 4, 0.02),
        EquipTemplate("D1234", "MTVR MK23", 3, 0.04),
    ],
    "infantry_battalion": [
        EquipTemplate("D1195", "HMMWV M1151", 35, 0.03),
        EquipTemplate("E0846", "JLTV M1280", 20, 0.02),
        EquipTemplate("D1234", "MTVR MK23", 12, 0.04),
        EquipTemplate("B2200", "M88A2 Recovery", 2, 0.03),
    ],
    "artillery_battalion": [
        EquipTemplate("D6005", "M777A2 155mm", 18, 0.02),
        EquipTemplate("D1234", "MTVR MK23", 24, 0.04),
        EquipTemplate("E0846", "JLTV M1280", 8, 0.02),
        EquipTemplate("B4444", "M142 HIMARS", 9, 0.02),
    ],
    "logistics_battalion": [
        EquipTemplate("D1234", "MTVR MK23", 48, 0.04),
        EquipTemplate("D1244", "MTVR MK25 Wrecker", 4, 0.03),
        EquipTemplate("D1266", "LVS MK48/18", 12, 0.05),
        EquipTemplate("D1195", "HMMWV M1151", 15, 0.03),
        EquipTemplate("E0880", "TRAM Forklift", 6, 0.04),
        EquipTemplate("B2200", "M88A2 Recovery", 2, 0.03),
    ],
    "recon_battalion": [
        EquipTemplate("D1195", "HMMWV M1151", 12, 0.03),
        EquipTemplate("E0846", "JLTV M1280", 8, 0.02),
    ],
    "aviation_squadron": [
        EquipTemplate("D1195", "HMMWV M1151", 6, 0.03),
        EquipTemplate("E0880", "TRAM Forklift", 2, 0.04),
    ],
    "mlr_littoral_combat_team": [
        EquipTemplate("E0846", "JLTV M1280", 15, 0.02),
        EquipTemplate("F0001", "NMESIS Launcher", 4, 0.01),
        EquipTemplate("D1234", "MTVR MK23", 6, 0.04),
    ],
    "mlr_anti_air_battalion": [
        EquipTemplate("E0846", "JLTV M1280", 10, 0.02),
        EquipTemplate("D1234", "MTVR MK23", 4, 0.04),
    ],
    "engineer_battalion": [
        EquipTemplate("D1234", "MTVR MK23", 15, 0.04),
        EquipTemplate("D1195", "HMMWV M1151", 10, 0.03),
        EquipTemplate("E1234", "D7G Dozer", 4, 0.05),
    ],
    "meu": [
        EquipTemplate("D1195", "HMMWV M1151", 20, 0.03),
        EquipTemplate("E0846", "JLTV M1280", 15, 0.02),
        EquipTemplate("D1234", "MTVR MK23", 30, 0.04),
    ],
}


# ---------------------------------------------------------------------------
# Scenario unit lists
# ---------------------------------------------------------------------------

SCENARIO_UNITS: dict[str, list[str]] = {
    "steel_guardian": [
        "1/7",
        "A Co 1/7",
        "B Co 1/7",
        "C Co 1/7",
        "Wpns Co 1/7",
        "H&S Co 1/7",
        "1/11",
        "CLB-7",
        "CLR-1",
        "1st Recon Bn",
    ],
    "pacific_fury": [
        "26th MEU",
        "2/6",
        "A Co 2/6",
        "B Co 2/6",
        "C Co 2/6",
        "Wpns Co 2/6",
        "H&S Co 2/6",
        "2/10",
        "VMM-266",
        "HMLA-269",
        "VMFA-251",
        "CLB-26",
        "2nd Recon Bn",
    ],
    "iron_forge": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "12th MLR",
        "12th LCT",
        "12th LAAB",
        "12th LLB",
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "3rd Recon Bn",
        "3rd CEB",
        "VMM-262",
        "HMLA-369",
        "CLB-3",
        "CLB-4",
        "CLR-3",
        "3rd Maint Bn",
        "9th ESB",
        "3rd TSB",
        "3rd Intel Bn",
        "7th Comm Bn",
        "31st MEU",
    ],
    # ── ITX (2/5 BN) ──
    "itx": [
        "2/5",
        "A Co 2/5",
        "B Co 2/5",
        "C Co 2/5",
        "Wpns Co 2/5",
        "H&S Co 2/5",
        "2/11",
        "CLB-5",
        "CLR-1",
        "1st Recon Bn",
    ],
    # ── Steel Knight (1st MarDiv) ──
    "steel_knight": [
        "1st MarDiv",
        "HQBN 1st MarDiv",
        "1/5",
        "A Co 1/5",
        "B Co 1/5",
        "C Co 1/5",
        "3/5",
        "A Co 3/5",
        "B Co 3/5",
        "C Co 3/5",
        "2/7",
        "A Co 2/7",
        "B Co 2/7",
        "C Co 2/7",
        "3/11",
        "1st LAR Bn",
        "CLB-11",
        "1st DSB",
        "I MIG",
        "9th Comm Bn",
        "1st Intel Bn",
    ],
    # ── COMPTUEX (24th MEU) ──
    "comptuex": [
        "24th MEU",
        "1/8",
        "A Co 1/8",
        "B Co 1/8",
        "C Co 1/8",
        "Wpns Co 1/8",
        "H&S Co 1/8",
        "CLB-24",
        "VMM-264",
        "HMLA-167",
        "VMFA-224",
    ],
    # ── Cobra Gold ──
    "cobra_gold": [
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "CLB-3",
        "VMM-262",
        "HMLA-369",
        "3rd Recon Bn",
    ],
    # ── Balikatan ──
    "balikatan": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "CLB-31",
        "3rd Recon Bn",
    ],
    # ── Resolute Dragon ──
    "resolute_dragon": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "CLB-4",
        "VMM-265",
        "HMLA-369",
        "3rd CEB",
    ],
    # ── Ssang Yong ──
    "ssang_yong": [
        "31st MEU",
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "CLB-31",
        "CLR-37",
        "VMM-262",
        "HMLA-369",
        "3rd Recon Bn",
    ],
    # ── Kamandag ──
    "kamandag": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "CLB-3",
        "VMM-262",
        "3rd Recon Bn",
    ],
    # ── Valiant Shield ──
    "valiant_shield": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "12th MLR",
        "12th LCT",
        "12th LAAB",
        "12th LLB",
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3/12",
        "CLB-3",
        "CLB-4",
        "CLR-3",
        "VMM-262",
        "HMLA-369",
        "31st MEU",
    ],
    # ── RIMPAC ──
    "rimpac": [
        "3/4",
        "A Co 3/4",
        "B Co 3/4",
        "C Co 3/4",
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "CLB-3",
        "VMM-268",
        "VMM-163",
        "31st MEU",
    ],
    # ── African Lion ──
    "african_lion": [
        "1/2",
        "A Co 1/2",
        "B Co 1/2",
        "C Co 1/2",
        "Wpns Co 1/2",
        "H&S Co 1/2",
        "CLB-2",
        "2nd LAR Bn",
    ],
    # ── Cold Response ──
    "cold_response": [
        "2/2",
        "A Co 2/2",
        "B Co 2/2",
        "C Co 2/2",
        "Wpns Co 2/2",
        "H&S Co 2/2",
        "CLB-6",
        "2nd LAR Bn",
        "8th Comm Bn",
        "2nd Intel Bn",
    ],
    # ── Native Fury ──
    "native_fury": [
        "1/8",
        "A Co 1/8",
        "B Co 1/8",
        "C Co 1/8",
        "Wpns Co 1/8",
        "H&S Co 1/8",
        "CLB-8",
        "2nd Recon Bn",
    ],
    # ── UNITAS ──
    "unitas": [
        "2/6",
        "A Co 2/6",
        "B Co 2/6",
        "C Co 2/6",
        "CLB-26",
        "VMM-266",
    ],
    # ── Reserve ITX ──
    "reserve_itx": [
        "1/23",
        "2/23",
        "3/23",
        "2/14",
        "3/14",
        "4th LAR Bn",
        "4th CEB",
        "CLB-451",
        "CLR-4",
        "4th Recon Bn",
    ],
    # ── Island Sentinel (EABO) ──
    "island_sentinel": [
        "3rd MLR",
        "3rd LCT",
        "3rd LAAB",
        "3rd LLB",
        "12th MLR",
        "12th LCT",
        "12th LAAB",
        "12th LLB",
        "CLB-31",
        "CLR-37",
        "3rd Recon Bn",
        "3rd CEB",
    ],
    # ── Trident Spear (13th MEU) ──
    "trident_spear": [
        "13th MEU",
        "1/4",
        "A Co 1/4",
        "B Co 1/4",
        "C Co 1/4",
        "Wpns Co 1/4",
        "H&S Co 1/4",
        "CLB-13",
        "VMM-161",
        "HMLA-469",
        "VMFA-211",
        "1st ANGLICO",
    ],
}


# ---------------------------------------------------------------------------
# Callsigns — imported from callsigns module
# ---------------------------------------------------------------------------

from simulator.callsigns import CALLSIGNS  # noqa: E402


# ---------------------------------------------------------------------------
# Scenario channels (mIRC)
# ---------------------------------------------------------------------------

SCENARIO_CHANNELS: dict[str, dict[str, dict]] = {
    "steel_guardian": {
        "#1-7-LOG-NET": {
            "units": [
                "1/7",
                "A Co 1/7",
                "B Co 1/7",
                "C Co 1/7",
                "Wpns Co 1/7",
            ],
            "content": "logistics",
        },
        "#1-7-MAINT-NET": {
            "units": ["1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7"],
            "content": "maintenance",
        },
        "#1-7-SUPPLY-REQ": {
            "units": ["1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7"],
            "content": "supply_requests",
        },
        "#CLB7-DISTRO": {
            "units": ["CLB-7", "CLR-1", "1/7"],
            "content": "distribution",
        },
        "#7THMAR-LOG-COMMON": {
            "units": ["1/7", "CLB-7", "CLR-1", "1/11"],
            "content": "regimental_log",
        },
        "#1-11-FIRES": {
            "units": ["1/11", "1/7"],
            "content": "fires_support",
        },
        "#RECON-OPS": {
            "units": ["1st Recon Bn", "1/7"],
            "content": "recon_ops",
        },
    },
    "pacific_fury": {
        "#26MEU-LOG-NET": {
            "units": ["26th MEU", "2/6", "CLB-26"],
            "content": "logistics",
        },
        "#BLT26-LOG": {
            "units": [
                "2/6",
                "A Co 2/6",
                "B Co 2/6",
                "C Co 2/6",
                "Wpns Co 2/6",
            ],
            "content": "logistics",
        },
        "#BLT26-MAINT": {
            "units": ["2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6"],
            "content": "maintenance",
        },
        "#CLB26-DISTRO": {
            "units": ["CLB-26", "2/6"],
            "content": "distribution",
        },
        "#MEU-ACE-OPS": {
            "units": ["VMM-266", "HMLA-269", "VMFA-251", "26th MEU"],
            "content": "aviation_ops",
        },
        "#2-10-FIRES": {
            "units": ["2/10", "2/6"],
            "content": "fires_support",
        },
        "#MEU-TAC-LOG": {
            "units": ["26th MEU", "2/6", "CLB-26", "VMM-266"],
            "content": "tactical_log",
        },
    },
    "iron_forge": {
        "#3MARDIV-LOG-NET": {
            "units": ["3rd MLR", "12th MLR", "3/4", "CLR-3"],
            "content": "logistics",
        },
        "#3MLR-LOG": {
            "units": ["3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB"],
            "content": "logistics",
        },
        "#12MLR-LOG": {
            "units": [
                "12th MLR",
                "12th LCT",
                "12th LAAB",
                "12th LLB",
            ],
            "content": "logistics",
        },
        "#3-4-LOG-NET": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#3-4-MAINT-NET": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "maintenance",
        },
        "#3MLG-DISTRO": {
            "units": ["CLR-3", "CLB-3", "CLB-4", "3rd TSB"],
            "content": "distribution",
        },
        "#3MLG-MAINT": {
            "units": ["3rd Maint Bn", "CLB-3", "CLB-4", "3/4"],
            "content": "maintenance",
        },
        "#3MARDIV-FIRES": {
            "units": ["3/12", "3rd MLR", "3/4"],
            "content": "fires_support",
        },
        "#31MEU-LOG": {
            "units": ["31st MEU"],
            "content": "logistics",
        },
    },
    # ── ITX (2/5) ──
    "itx": {
        "#2-5-LOG-NET": {
            "units": [
                "2/5",
                "A Co 2/5",
                "B Co 2/5",
                "C Co 2/5",
                "Wpns Co 2/5",
            ],
            "content": "logistics",
        },
        "#2-5-MAINT-NET": {
            "units": ["2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5"],
            "content": "maintenance",
        },
        "#2-5-SUPPLY-REQ": {
            "units": ["2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5"],
            "content": "supply_requests",
        },
        "#CLB5-DISTRO": {
            "units": ["CLB-5", "CLR-1", "2/5"],
            "content": "distribution",
        },
        "#5THMAR-LOG-COMMON": {
            "units": ["2/5", "CLB-5", "CLR-1", "2/11"],
            "content": "regimental_log",
        },
        "#2-11-FIRES": {
            "units": ["2/11", "2/5"],
            "content": "fires_support",
        },
        "#RECON-OPS": {
            "units": ["1st Recon Bn", "2/5"],
            "content": "recon_ops",
        },
    },
    # ── Steel Knight (1st MarDiv) ──
    "steel_knight": {
        "#1MARDIV-LOG-NET": {
            "units": [
                "1st MarDiv",
                "HQBN 1st MarDiv",
                "1/5",
                "3/5",
                "2/7",
                "CLB-11",
                "1st DSB",
            ],
            "content": "logistics",
        },
        "#1-5-LOG-NET": {
            "units": ["1/5", "A Co 1/5", "B Co 1/5", "C Co 1/5"],
            "content": "logistics",
        },
        "#3-5-LOG-NET": {
            "units": ["3/5", "A Co 3/5", "B Co 3/5", "C Co 3/5"],
            "content": "logistics",
        },
        "#2-7-LOG-NET": {
            "units": ["2/7", "A Co 2/7", "B Co 2/7", "C Co 2/7"],
            "content": "logistics",
        },
        "#1MARDIV-MAINT": {
            "units": ["1st MarDiv", "CLB-11", "1st DSB"],
            "content": "maintenance",
        },
        "#3-11-FIRES": {
            "units": ["3/11", "1/5", "3/5", "2/7"],
            "content": "fires_support",
        },
        "#1MARDIV-INTEL": {
            "units": ["1st MarDiv", "1st Intel Bn", "I MIG"],
            "content": "intelligence",
        },
        "#1MARDIV-COMMS": {
            "units": ["9th Comm Bn", "1st MarDiv", "I MIG"],
            "content": "communications",
        },
        "#CLB11-DISTRO": {
            "units": ["CLB-11", "1st DSB", "1/5", "3/5", "2/7"],
            "content": "distribution",
        },
    },
    # ── COMPTUEX (24th MEU) ──
    "comptuex": {
        "#24MEU-LOG-NET": {
            "units": ["24th MEU", "1/8", "CLB-24"],
            "content": "logistics",
        },
        "#BLT-1-8-LOG": {
            "units": [
                "1/8",
                "A Co 1/8",
                "B Co 1/8",
                "C Co 1/8",
                "Wpns Co 1/8",
            ],
            "content": "logistics",
        },
        "#BLT-1-8-MAINT": {
            "units": ["1/8", "A Co 1/8", "B Co 1/8", "C Co 1/8"],
            "content": "maintenance",
        },
        "#CLB24-DISTRO": {
            "units": ["CLB-24", "1/8"],
            "content": "distribution",
        },
        "#24MEU-ACE-OPS": {
            "units": ["VMM-264", "HMLA-167", "VMFA-224", "24th MEU"],
            "content": "aviation_ops",
        },
        "#24MEU-TAC-LOG": {
            "units": ["24th MEU", "1/8", "CLB-24", "VMM-264"],
            "content": "tactical_log",
        },
    },
    # ── Cobra Gold ──
    "cobra_gold": {
        "#CG-LOG-NET": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4", "CLB-3"],
            "content": "logistics",
        },
        "#CG-MAINT-NET": {
            "units": ["3/4", "CLB-3"],
            "content": "maintenance",
        },
        "#CG-FIRES": {
            "units": ["3/12", "3/4"],
            "content": "fires_support",
        },
        "#CG-AVN-OPS": {
            "units": ["VMM-262", "HMLA-369"],
            "content": "aviation_ops",
        },
        "#CG-RECON": {
            "units": ["3rd Recon Bn", "3/4"],
            "content": "recon_ops",
        },
    },
    # ── Balikatan ──
    "balikatan": {
        "#BK-LOG-NET": {
            "units": [
                "3rd MLR",
                "3rd LCT",
                "3rd LAAB",
                "3rd LLB",
                "CLB-31",
            ],
            "content": "logistics",
        },
        "#BK-3-4-LOG": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#BK-FIRES": {
            "units": ["3/12", "3/4", "3rd MLR"],
            "content": "fires_support",
        },
        "#BK-EABO-OPS": {
            "units": ["3rd MLR", "3rd LCT", "3rd LAAB"],
            "content": "eabo_operations",
        },
        "#BK-RECON": {
            "units": ["3rd Recon Bn", "3/4"],
            "content": "recon_ops",
        },
    },
    # ── Resolute Dragon ──
    "resolute_dragon": {
        "#RD-LOG-NET": {
            "units": [
                "3rd MLR",
                "3rd LCT",
                "3rd LAAB",
                "3rd LLB",
                "CLB-4",
            ],
            "content": "logistics",
        },
        "#RD-3-4-LOG": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#RD-FIRES": {
            "units": ["3/12", "3/4", "3rd MLR"],
            "content": "fires_support",
        },
        "#RD-AVN-OPS": {
            "units": ["VMM-265", "HMLA-369"],
            "content": "aviation_ops",
        },
        "#RD-ENGR": {
            "units": ["3rd CEB", "3/4"],
            "content": "engineer_ops",
        },
    },
    # ── Ssang Yong ──
    "ssang_yong": {
        "#SY-LOG-NET": {
            "units": ["31st MEU", "3/4", "CLB-31", "CLR-37"],
            "content": "logistics",
        },
        "#SY-3-4-LOG": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#SY-FIRES": {
            "units": ["3/12", "3/4"],
            "content": "fires_support",
        },
        "#SY-AVN-OPS": {
            "units": ["VMM-262", "HMLA-369", "31st MEU"],
            "content": "aviation_ops",
        },
        "#SY-RECON": {
            "units": ["3rd Recon Bn", "3/4"],
            "content": "recon_ops",
        },
        "#SY-CLB31-DISTRO": {
            "units": ["CLB-31", "CLR-37", "3/4"],
            "content": "distribution",
        },
    },
    # ── Kamandag ──
    "kamandag": {
        "#KD-LOG-NET": {
            "units": [
                "3rd MLR",
                "3rd LCT",
                "3rd LAAB",
                "3rd LLB",
                "CLB-3",
            ],
            "content": "logistics",
        },
        "#KD-AVN-OPS": {
            "units": ["VMM-262", "3rd MLR"],
            "content": "aviation_ops",
        },
        "#KD-RECON": {
            "units": ["3rd Recon Bn", "3rd LCT"],
            "content": "recon_ops",
        },
    },
    # ── Valiant Shield ──
    "valiant_shield": {
        "#VS-LOG-NET": {
            "units": [
                "3rd MLR",
                "12th MLR",
                "3/4",
                "CLB-3",
                "CLB-4",
                "CLR-3",
            ],
            "content": "logistics",
        },
        "#VS-3MLR-LOG": {
            "units": ["3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB"],
            "content": "logistics",
        },
        "#VS-12MLR-LOG": {
            "units": ["12th MLR", "12th LCT", "12th LAAB", "12th LLB"],
            "content": "logistics",
        },
        "#VS-3-4-LOG": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#VS-FIRES": {
            "units": ["3/12", "3rd MLR", "3/4"],
            "content": "fires_support",
        },
        "#VS-AVN-OPS": {
            "units": ["VMM-262", "HMLA-369", "31st MEU"],
            "content": "aviation_ops",
        },
        "#VS-DISTRO": {
            "units": ["CLR-3", "CLB-3", "CLB-4"],
            "content": "distribution",
        },
    },
    # ── RIMPAC ──
    "rimpac": {
        "#RIMPAC-LOG-NET": {
            "units": [
                "3/4",
                "3rd MLR",
                "CLB-3",
                "31st MEU",
            ],
            "content": "logistics",
        },
        "#RIMPAC-3-4-LOG": {
            "units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"],
            "content": "logistics",
        },
        "#RIMPAC-MLR-LOG": {
            "units": ["3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB"],
            "content": "logistics",
        },
        "#RIMPAC-AVN-OPS": {
            "units": ["VMM-268", "VMM-163"],
            "content": "aviation_ops",
        },
        "#RIMPAC-DISTRO": {
            "units": ["CLB-3", "3/4", "3rd MLR"],
            "content": "distribution",
        },
    },
    # ── African Lion ──
    "african_lion": {
        "#AL-LOG-NET": {
            "units": [
                "1/2",
                "A Co 1/2",
                "B Co 1/2",
                "C Co 1/2",
                "CLB-2",
            ],
            "content": "logistics",
        },
        "#AL-MAINT-NET": {
            "units": ["1/2", "CLB-2"],
            "content": "maintenance",
        },
        "#AL-SUPPLY-REQ": {
            "units": ["1/2", "A Co 1/2", "B Co 1/2", "C Co 1/2"],
            "content": "supply_requests",
        },
        "#AL-DISTRO": {
            "units": ["CLB-2", "1/2"],
            "content": "distribution",
        },
        "#AL-RECON": {
            "units": ["2nd LAR Bn", "1/2"],
            "content": "recon_ops",
        },
    },
    # ── Cold Response ──
    "cold_response": {
        "#CR-LOG-NET": {
            "units": [
                "2/2",
                "A Co 2/2",
                "B Co 2/2",
                "C Co 2/2",
                "CLB-6",
            ],
            "content": "logistics",
        },
        "#CR-MAINT-NET": {
            "units": ["2/2", "CLB-6"],
            "content": "maintenance",
        },
        "#CR-SUPPLY-REQ": {
            "units": ["2/2", "A Co 2/2", "B Co 2/2", "C Co 2/2"],
            "content": "supply_requests",
        },
        "#CR-DISTRO": {
            "units": ["CLB-6", "2/2"],
            "content": "distribution",
        },
        "#CR-RECON": {
            "units": ["2nd LAR Bn", "2/2"],
            "content": "recon_ops",
        },
        "#CR-COMMS": {
            "units": ["8th Comm Bn", "2/2"],
            "content": "communications",
        },
        "#CR-INTEL": {
            "units": ["2nd Intel Bn", "2/2"],
            "content": "intelligence",
        },
    },
    # ── Native Fury ──
    "native_fury": {
        "#NF-LOG-NET": {
            "units": [
                "1/8",
                "A Co 1/8",
                "B Co 1/8",
                "C Co 1/8",
                "CLB-8",
            ],
            "content": "logistics",
        },
        "#NF-MAINT-NET": {
            "units": ["1/8", "CLB-8"],
            "content": "maintenance",
        },
        "#NF-SUPPLY-REQ": {
            "units": ["1/8", "A Co 1/8", "B Co 1/8", "C Co 1/8"],
            "content": "supply_requests",
        },
        "#NF-DISTRO": {
            "units": ["CLB-8", "1/8"],
            "content": "distribution",
        },
        "#NF-RECON": {
            "units": ["2nd Recon Bn", "1/8"],
            "content": "recon_ops",
        },
    },
    # ── UNITAS ──
    "unitas": {
        "#UN-LOG-NET": {
            "units": ["2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6", "CLB-26"],
            "content": "logistics",
        },
        "#UN-AVN-OPS": {
            "units": ["VMM-266", "2/6"],
            "content": "aviation_ops",
        },
        "#UN-DISTRO": {
            "units": ["CLB-26", "2/6"],
            "content": "distribution",
        },
    },
    # ── Reserve ITX ──
    "reserve_itx": {
        "#RITX-LOG-NET": {
            "units": ["1/23", "2/23", "3/23", "CLB-451", "CLR-4"],
            "content": "logistics",
        },
        "#RITX-MAINT-NET": {
            "units": ["1/23", "2/23", "3/23", "CLB-451"],
            "content": "maintenance",
        },
        "#RITX-FIRES": {
            "units": ["2/14", "3/14", "1/23", "2/23", "3/23"],
            "content": "fires_support",
        },
        "#RITX-DISTRO": {
            "units": ["CLB-451", "CLR-4", "1/23", "2/23", "3/23"],
            "content": "distribution",
        },
        "#RITX-RECON": {
            "units": ["4th Recon Bn", "4th LAR Bn", "1/23"],
            "content": "recon_ops",
        },
        "#RITX-ENGR": {
            "units": ["4th CEB", "1/23", "2/23"],
            "content": "engineer_ops",
        },
    },
    # ── Island Sentinel ──
    "island_sentinel": {
        "#IS-LOG-NET": {
            "units": [
                "3rd MLR",
                "12th MLR",
                "CLB-31",
                "CLR-37",
            ],
            "content": "logistics",
        },
        "#IS-3MLR-OPS": {
            "units": ["3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB"],
            "content": "eabo_operations",
        },
        "#IS-12MLR-OPS": {
            "units": ["12th MLR", "12th LCT", "12th LAAB", "12th LLB"],
            "content": "eabo_operations",
        },
        "#IS-DISTRO": {
            "units": ["CLB-31", "CLR-37", "3rd MLR", "12th MLR"],
            "content": "distribution",
        },
        "#IS-RECON": {
            "units": ["3rd Recon Bn", "3rd MLR", "12th MLR"],
            "content": "recon_ops",
        },
        "#IS-ENGR": {
            "units": ["3rd CEB", "3rd MLR"],
            "content": "engineer_ops",
        },
    },
    # ── Trident Spear (13th MEU) ──
    "trident_spear": {
        "#TS-LOG-NET": {
            "units": ["13th MEU", "1/4", "CLB-13"],
            "content": "logistics",
        },
        "#TS-BLT-LOG": {
            "units": [
                "1/4",
                "A Co 1/4",
                "B Co 1/4",
                "C Co 1/4",
                "Wpns Co 1/4",
            ],
            "content": "logistics",
        },
        "#TS-BLT-MAINT": {
            "units": ["1/4", "A Co 1/4", "B Co 1/4", "C Co 1/4"],
            "content": "maintenance",
        },
        "#TS-CLB13-DISTRO": {
            "units": ["CLB-13", "1/4"],
            "content": "distribution",
        },
        "#TS-ACE-OPS": {
            "units": ["VMM-161", "HMLA-469", "VMFA-211", "13th MEU"],
            "content": "aviation_ops",
        },
        "#TS-TAC-LOG": {
            "units": ["13th MEU", "1/4", "CLB-13", "VMM-161"],
            "content": "tactical_log",
        },
        "#TS-FIRES": {
            "units": ["1st ANGLICO", "1/4", "13th MEU"],
            "content": "fires_support",
        },
    },
}


def _get_channels_for_unit(abbr: str, scenario_name: str) -> list[str]:
    """Return list of mIRC channels a unit participates in."""
    channels: list[str] = []
    scenario_channels = SCENARIO_CHANNELS.get(scenario_name, {})
    for channel_name, config in scenario_channels.items():
        if abbr in config["units"]:
            channels.append(channel_name)
    return channels


# ---------------------------------------------------------------------------
# Hierarchy lookup (lazy-loaded from seed.seed_units)
# ---------------------------------------------------------------------------

_FLAT_HIERARCHY: dict[str, dict] | None = None


def _flatten_hierarchy(
    tree: dict,
    parent_abbr: str | None = None,
) -> dict[str, dict]:
    """Flatten the recursive UNIT_HIERARCHY into
    ``{abbr: {name, echelon, uic, parent_abbr, children_abbrs}}``.

    The *tree* dict has unit full-names as keys; values contain ``abbr``,
    ``echelon`` (an Echelon enum or str), ``uic``, and optionally ``children``.
    """
    result: dict[str, dict] = {}
    for full_name, info in tree.items():
        abbr = info["abbr"]
        echelon_raw = info["echelon"]
        # Echelon may be an enum instance (e.g., Echelon.BN) -- normalise to str
        echelon_str = (
            echelon_raw.value if hasattr(echelon_raw, "value") else str(echelon_raw)
        )

        children_dict = info.get("children", {})
        children_abbrs = [child["abbr"] for child in children_dict.values()]

        result[abbr] = {
            "name": full_name,
            "echelon": echelon_str,
            "uic": info["uic"],
            "parent_abbr": parent_abbr,
            "children_abbrs": children_abbrs,
        }

        # Recurse into children
        if children_dict:
            child_flat = _flatten_hierarchy(children_dict, parent_abbr=abbr)
            result.update(child_flat)

    return result


def _ensure_hierarchy() -> None:
    """Lazily load and flatten the unit hierarchy from seed data."""
    global _FLAT_HIERARCHY
    if _FLAT_HIERARCHY is None:
        from seed.seed_units import UNIT_HIERARCHY

        _FLAT_HIERARCHY = _flatten_hierarchy(UNIT_HIERARCHY)


def get_unit_info(abbr: str) -> dict | None:
    """Look up a unit by abbreviation from the flattened hierarchy."""
    _ensure_hierarchy()
    assert _FLAT_HIERARCHY is not None
    return _FLAT_HIERARCHY.get(abbr)


def get_parent_chain(abbr: str) -> list[str]:
    """Return parent chain from the unit up to the root.

    Example::

        get_parent_chain('A Co 1/7')
        # => ['A Co 1/7', '1/7', '7th Marines', '1st MarDiv', 'I MEF']
    """
    _ensure_hierarchy()
    assert _FLAT_HIERARCHY is not None
    chain: list[str] = []
    current: str | None = abbr
    while current is not None:
        chain.append(current)
        info = _FLAT_HIERARCHY.get(current)
        if info is None:
            break
        current = info.get("parent_abbr")
    return chain


def get_children(abbr: str, recursive: bool = False) -> list[str]:
    """Return child unit abbreviations.

    If *recursive*, include all descendants.
    """
    _ensure_hierarchy()
    assert _FLAT_HIERARCHY is not None
    info = _FLAT_HIERARCHY.get(abbr)
    if info is None:
        return []

    direct = list(info.get("children_abbrs", []))
    if not recursive:
        return direct

    result: list[str] = []
    stack = list(direct)
    while stack:
        child = stack.pop(0)
        result.append(child)
        child_info = _FLAT_HIERARCHY.get(child)
        if child_info:
            stack.extend(child_info.get("children_abbrs", []))
    return result


def get_units_for_scenario(scenario_name: str) -> list[str]:
    """Return the list of unit abbreviations for a given scenario."""
    if scenario_name not in SCENARIO_UNITS:
        available = ", ".join(sorted(SCENARIO_UNITS.keys()))
        raise ValueError(f"Unknown scenario '{scenario_name}'. Available: {available}")
    return list(SCENARIO_UNITS[scenario_name])


# ---------------------------------------------------------------------------
# Unit type classifier
# ---------------------------------------------------------------------------


def classify_unit_type(unit_abbr: str, echelon: str) -> str:
    """Determine supply/equipment template key for a unit."""
    if echelon == "CO":
        return "infantry_company"
    if "Recon" in unit_abbr:
        return "recon_battalion"
    if any(x in unit_abbr for x in ["CLB", "DSB", "TSB"]):
        return "logistics_battalion"
    if "LCT" in unit_abbr:
        return "mlr_littoral_combat_team"
    if "LAAB" in unit_abbr:
        return "mlr_anti_air_battalion"
    if "LLB" in unit_abbr:
        return "logistics_battalion"
    if any(x in unit_abbr for x in ["VMM", "VMFA", "HMLA", "HMH", "VMGR", "VMU"]):
        return "aviation_squadron"
    if any(x in unit_abbr for x in ["CEB", "ESB"]):
        return "engineer_battalion"
    if "MEU" in unit_abbr:
        return "meu"
    # Check for artillery battalions (e.g., 1/11, 2/10, 3/12, 2/14)
    if "/" in unit_abbr and echelon == "BN":
        parts = unit_abbr.split("/")
        if len(parts) == 2:
            try:
                regt_num = int(parts[1])
                if regt_num in (10, 11, 12, 14):
                    return "artillery_battalion"
            except ValueError:
                pass
    if echelon == "BN":
        return "infantry_battalion"
    return "infantry_battalion"


# ---------------------------------------------------------------------------
# Unit state creation
# ---------------------------------------------------------------------------


def create_unit_states_for_scenario(scenario_name: str) -> list[UnitState]:
    """Create UnitState objects for all units in a scenario, using templates."""
    unit_abbrs = get_units_for_scenario(scenario_name)
    ao = SCENARIO_AO.get(scenario_name, AO_29_PALMS)
    # Filter to only (lat, lon) tuples -- exclude scalar config like 'radius_km'
    position_pool = [v for v in ao.values() if isinstance(v, tuple)]

    states: list[UnitState] = []
    for i, abbr in enumerate(unit_abbrs):
        info = get_unit_info(abbr)
        if info is None:
            continue

        unit_type = classify_unit_type(abbr, info["echelon"])
        position = position_pool[i % len(position_pool)]

        # Build supply items from template
        supply_templates = SUPPLY_TEMPLATES.get(
            unit_type, SUPPLY_TEMPLATES["infantry_battalion"]
        )
        supply_items: list[SupplyItem] = []
        for st in supply_templates:
            on_hand = st.required * random.uniform(0.6, 1.0)
            supply_items.append(
                SupplyItem(
                    name=st.name,
                    supply_class=st.supply_class,
                    unit_of_measure=st.unit_of_measure,
                    on_hand=round(on_hand, 0),
                    required=st.required,
                    daily_consumption_rate=st.daily_rate,
                )
            )

        # Build equipment from template
        equip_templates = EQUIPMENT_TEMPLATES.get(
            unit_type, EQUIPMENT_TEMPLATES["infantry_battalion"]
        )
        equipment_categories: list[EquipmentCategory] = []
        for et in equip_templates:
            items: list[EquipmentItem] = []
            for j in range(et.count):
                serial = (
                    f"{et.tamcn}-{abbr.replace('/', '-').replace(' ', '')}-{j + 1:03d}"
                )
                if random.random() > et.breakdown_rate * 3:
                    eq_status = "MC"
                else:
                    eq_status = random.choice(["NMCM", "NMCS"])
                items.append(
                    EquipmentItem(
                        tamcn=et.tamcn,
                        nomenclature=et.nomenclature,
                        serial=serial,
                        status=eq_status,
                    )
                )
            equipment_categories.append(
                EquipmentCategory(
                    tamcn=et.tamcn,
                    nomenclature=et.nomenclature,
                    total_possessed=et.count,
                    items=items,
                )
            )

        # Callsigns -- use known dict or generate defaults
        callsigns = CALLSIGNS.get(
            abbr,
            [
                f"{abbr.upper().replace(' ', '-')}-6",
                f"{abbr.upper().replace(' ', '-')}-4",
            ],
        )

        # Channels from scenario channel config
        channels = _get_channels_for_unit(abbr, scenario_name)

        states.append(
            UnitState(
                unit_name=info["name"],
                abbreviation=abbr,
                echelon=info["echelon"],
                position=position,
                supply_items=supply_items,
                equipment_categories=equipment_categories,
                callsigns=callsigns,
                channels=channels,
                current_tempo="MEDIUM",
            )
        )

    return states


def create_default_unit_states(
    scenario_name: str = "steel_guardian",
) -> list[UnitState]:
    """Backward-compatible wrapper around :func:`create_unit_states_for_scenario`."""
    return create_unit_states_for_scenario(scenario_name)
