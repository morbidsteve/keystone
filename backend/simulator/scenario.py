"""Scenario definitions for the KEYSTONE simulator.

A Scenario describes a multi-day exercise with named phases, unit assignments,
and initial event scheduling. The simulator engine loads a scenario by name
and uses it to populate the event queue.
"""

from __future__ import annotations

import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from simulator.events.event_types import EventType
from simulator.events.event_queue import SimEvent
from simulator.units import UnitState, create_unit_states_for_scenario

if TYPE_CHECKING:
    from simulator.clock import SimulationClock
    from simulator.events.event_queue import EventQueue

logger = logging.getLogger("simulator.scenario")


@dataclass
class Phase:
    """A named phase within a scenario with a start offset and tempo."""

    name: str
    start_offset_hours: float
    duration_hours: float
    tempo: str  # LOW, MEDIUM, HIGH
    description: str = ""


@dataclass
class Scenario:
    """A complete exercise scenario with phases, units, and event templates."""

    name: str
    display_name: str
    description: str
    start_time: datetime
    end_time: datetime
    phases: list[Phase] = field(default_factory=list)
    units: list[UnitState] = field(default_factory=list)

    @property
    def duration_hours(self) -> float:
        return (self.end_time - self.start_time).total_seconds() / 3600

    def schedule_initial_events(
        self, queue: "EventQueue", clock: "SimulationClock"
    ) -> None:
        """Populate the event queue with all initial and recurring events.

        This includes:
        - LOGSTAT_DUE every 12 hours for all units
        - READINESS_REPORT_DUE every 24 hours for all units
        - SUPPLY_CONSUMPTION every 1 hour (global)
        - EQUIPMENT_BREAKDOWN randomly based on op tempo
        - PHASE_CHANGE at phase boundaries
        - Random scheduled CONVOY events
        """
        sim_start = self.start_time

        # --- Phase transitions ---
        for phase in self.phases:
            phase_time = sim_start + timedelta(hours=phase.start_offset_hours)
            if phase_time > sim_start:
                queue.schedule(
                    SimEvent(
                        fire_at=phase_time,
                        event_type=EventType.PHASE_CHANGE,
                        unit_id="ALL",
                        priority=1,
                        data={
                            "phase_name": phase.name,
                            "tempo": phase.tempo,
                            "description": phase.description,
                        },
                    )
                )

        # --- Supply consumption — global tick every sim hour ---
        queue.schedule(
            SimEvent(
                fire_at=sim_start + timedelta(hours=1),
                event_type=EventType.SUPPLY_CONSUMPTION,
                unit_id="ALL",
                priority=7,
                data={"hours": 1.0},
            )
        )

        # --- Per-unit recurring events ---
        for unit in self.units:
            # LOGSTAT every 12 hours (stagger by unit)
            stagger = random.uniform(0, 2)  # hours
            queue.schedule(
                SimEvent(
                    fire_at=sim_start + timedelta(hours=stagger),
                    event_type=EventType.LOGSTAT_DUE,
                    unit_id=unit.abbreviation,
                    priority=6,
                )
            )

            # READINESS_REPORT every 24 hours
            stagger_r = random.uniform(0, 4)
            queue.schedule(
                SimEvent(
                    fire_at=sim_start + timedelta(hours=stagger_r),
                    event_type=EventType.READINESS_REPORT_DUE,
                    unit_id=unit.abbreviation,
                    priority=6,
                )
            )

        # --- Equipment breakdowns scattered across the exercise ---
        self._schedule_breakdowns(queue, sim_start)

        # --- Scheduled resupply convoys ---
        self._schedule_convoys(queue, sim_start)

        total = len(queue)
        logger.info(
            f"Scheduled {total} initial events for scenario '{self.name}'"
        )

    def _schedule_breakdowns(
        self, queue: "EventQueue", sim_start: datetime
    ) -> None:
        """Schedule random equipment breakdowns based on tempo probabilities.

        Probability per unit per day:
          HIGH   = 15%
          MEDIUM = 8%
          LOW    = 3%
        """
        tempo_prob = {"LOW": 0.03, "MEDIUM": 0.08, "HIGH": 0.15}

        total_days = self.duration_hours / 24
        for day in range(int(total_days) + 1):
            # Determine tempo for this day based on which phase we're in
            day_hour = day * 24
            current_tempo = "MEDIUM"
            for phase in self.phases:
                phase_end = phase.start_offset_hours + phase.duration_hours
                if phase.start_offset_hours <= day_hour < phase_end:
                    current_tempo = phase.tempo
                    break

            prob = tempo_prob.get(current_tempo, 0.08)

            for unit in self.units:
                if random.random() < prob:
                    # Random time within that day
                    hour_offset = day * 24 + random.uniform(0, 24)
                    fire_at = sim_start + timedelta(hours=hour_offset)
                    if fire_at < self.end_time:
                        queue.schedule(
                            SimEvent(
                                fire_at=fire_at,
                                event_type=EventType.EQUIPMENT_BREAKDOWN,
                                unit_id=unit.abbreviation,
                                priority=4,
                            )
                        )

    def _schedule_convoys(
        self, queue: "EventQueue", sim_start: datetime
    ) -> None:
        """Schedule routine resupply convoys from CLB-1 to line companies."""
        line_units = [u for u in self.units if u.echelon == "CO"]
        total_days = self.duration_hours / 24

        for day in range(int(total_days) + 1):
            # 1-2 scheduled convoys per day
            num_convoys = random.randint(1, 2)
            for _ in range(num_convoys):
                target_unit = random.choice(line_units)
                hour_offset = day * 24 + random.uniform(6, 18)
                fire_at = sim_start + timedelta(hours=hour_offset)
                if fire_at < self.end_time:
                    queue.schedule(
                        SimEvent(
                            fire_at=fire_at,
                            event_type=EventType.RESUPPLY_CONVOY,
                            unit_id=target_unit.abbreviation,
                            priority=5,
                            data={
                                "supply_class": random.choice(
                                    ["I", "III", "V", "VIII"]
                                ),
                            },
                        )
                    )


# ---------------------------------------------------------------------------
# Scenario catalog
# ---------------------------------------------------------------------------


def _build_steel_guardian() -> Scenario:
    """Build the Steel Guardian scenario — 29 Palms FEX, 5 phases, 7 days."""
    start = datetime(2026, 3, 10, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=7)

    phases = [
        Phase(
            name="Phase 0 — Deployment & Assembly",
            start_offset_hours=0,
            duration_hours=24,
            tempo="LOW",
            description=(
                "Units deploy from Camp Pendleton to 29 Palms MCAGCC. "
                "Establish FOBs, draw ammunition, validate communications."
            ),
        ),
        Phase(
            name="Phase I — Defense",
            start_offset_hours=24,
            duration_hours=48,
            tempo="MEDIUM",
            description=(
                "Establish defensive positions. Conduct security patrols. "
                "CLB-1 establishes MSR and supply points."
            ),
        ),
        Phase(
            name="Phase II — Offensive Operations",
            start_offset_hours=72,
            duration_hours=48,
            tempo="HIGH",
            description=(
                "Conduct offensive operations to seize OBJ GRANITE and OBJ IRON. "
                "High consumption rates for Class III and V. "
                "Increased equipment breakdowns expected."
            ),
        ),
        Phase(
            name="Phase III — Stability Operations",
            start_offset_hours=120,
            duration_hours=36,
            tempo="MEDIUM",
            description=(
                "Consolidate gains. Conduct stability operations. "
                "Focus on resupply and equipment recovery."
            ),
        ),
        Phase(
            name="Phase IV — Redeployment",
            start_offset_hours=156,
            duration_hours=12,
            tempo="LOW",
            description=(
                "LACE report, LOGSTAT final, equipment accountability. "
                "Redeploy to Camp Pendleton."
            ),
        ),
    ]

    units = create_unit_states_for_scenario("steel_guardian")

    return Scenario(
        name="steel_guardian",
        display_name="Exercise Steel Guardian",
        description=(
            "7-day battalion-level FEX at 29 Palms MCAGCC. "
            "1/1 Marines with CLB-1 support. Five-phase exercise testing "
            "logistics sustainment under varying operational tempos."
        ),
        start_time=start,
        end_time=end,
        phases=phases,
        units=units,
    )


def _build_pacific_fury() -> Scenario:
    """Build Pacific Fury — 26th MEU Pre-Deployment Training and Embark, Camp Lejeune."""
    units = create_unit_states_for_scenario("pacific_fury")
    return Scenario(
        name="pacific_fury",
        display_name="Pacific Fury",
        description="26th MEU Pre-Deployment Training and Embark, Camp Lejeune",
        start_time=datetime(2026, 6, 1, 6, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 10, 13, 18, 0, tzinfo=timezone.utc),  # 135 days
        phases=[
            Phase(
                "Pre-Deployment Training",
                0,
                14 * 24,
                "MEDIUM",
                "Individual and unit-level training",
            ),
            Phase(
                "COMPTUEX",
                14 * 24,
                14 * 24,
                "HIGH",
                "Composite Training Unit Exercise",
            ),
            Phase(
                "Embark",
                28 * 24,
                4 * 24,
                "MEDIUM",
                "Load ships, final preparations",
            ),
            Phase(
                "Transit",
                32 * 24,
                13 * 24,
                "LOW",
                "Transit to theater",
            ),
            Phase(
                "Theater Operations",
                45 * 24,
                75 * 24,
                "HIGH",
                "Deployed operations",
            ),
            Phase(
                "Redeployment",
                120 * 24,
                15 * 24,
                "LOW",
                "Return transit and offload",
            ),
        ],
        units=units,
    )


def _build_iron_forge() -> Scenario:
    """Build Iron Forge — III MEF Garrison Steady-State Operations, Okinawa."""
    units = create_unit_states_for_scenario("iron_forge")
    return Scenario(
        name="iron_forge",
        display_name="Iron Forge",
        description="III MEF Garrison Steady-State Operations, Okinawa",
        start_time=datetime(2026, 9, 15, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 12, 14, 0, 0, tzinfo=timezone.utc),  # 90 days
        phases=[
            Phase(
                "Routine Operations I",
                0,
                30 * 24,
                "LOW",
                "Normal garrison operations",
            ),
            Phase(
                "Exercise Prep",
                30 * 24,
                7 * 24,
                "MEDIUM",
                "Preparation for bilateral exercise",
            ),
            Phase(
                "Exercise Execution",
                37 * 24,
                7 * 24,
                "HIGH",
                "Bilateral exercise with JSDF",
            ),
            Phase(
                "Post-Exercise Recovery",
                44 * 24,
                7 * 24,
                "LOW",
                "Recovery and maintenance",
            ),
            Phase(
                "Routine Operations II",
                51 * 24,
                39 * 24,
                "LOW",
                "Return to garrison routine",
            ),
        ],
        units=units,
    )


_SCENARIO_CATALOG: dict[str, callable] = {
    "steel_guardian": _build_steel_guardian,
    "pacific_fury": _build_pacific_fury,
    "iron_forge": _build_iron_forge,
}


def get_scenario(name: str) -> Scenario:
    """Load a scenario by name.

    Raises:
        ValueError: If the scenario name is not recognized.
    """
    builder = _SCENARIO_CATALOG.get(name)
    if builder is None:
        available = ", ".join(sorted(_SCENARIO_CATALOG.keys()))
        raise ValueError(
            f"Unknown scenario '{name}'. Available scenarios: {available}"
        )
    return builder()


def list_scenarios() -> list[dict[str, str]]:
    """Return a summary of all available scenarios."""
    results = []
    for name, builder in sorted(_SCENARIO_CATALOG.items()):
        scenario = builder()
        results.append({
            "name": scenario.name,
            "display_name": scenario.display_name,
            "description": scenario.description,
            "duration": f"{scenario.duration_hours:.0f} hours",
            "phases": str(len(scenario.phases)),
            "units": str(len(scenario.units)),
        })
    return results
