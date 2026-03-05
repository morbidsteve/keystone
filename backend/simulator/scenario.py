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
import typing
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
        logger.info(f"Scheduled {total} initial events for scenario '{self.name}'")

    def _schedule_breakdowns(self, queue: "EventQueue", sim_start: datetime) -> None:
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

    def _schedule_convoys(self, queue: "EventQueue", sim_start: datetime) -> None:
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
    """Build the Steel Guardian scenario -- 29 Palms FEX, 5 phases, 7 days."""
    start = datetime(2026, 3, 10, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=7)

    phases = [
        Phase(
            name="Phase 0 -- Deployment & Assembly",
            start_offset_hours=0,
            duration_hours=24,
            tempo="LOW",
            description=(
                "Units deploy from Camp Pendleton to 29 Palms MCAGCC. "
                "Establish FOBs, draw ammunition, validate communications."
            ),
        ),
        Phase(
            name="Phase I -- Defense",
            start_offset_hours=24,
            duration_hours=48,
            tempo="MEDIUM",
            description=(
                "Establish defensive positions. Conduct security patrols. "
                "CLB-1 establishes MSR and supply points."
            ),
        ),
        Phase(
            name="Phase II -- Offensive Operations",
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
            name="Phase III -- Stability Operations",
            start_offset_hours=120,
            duration_hours=36,
            tempo="MEDIUM",
            description=(
                "Consolidate gains. Conduct stability operations. "
                "Focus on resupply and equipment recovery."
            ),
        ),
        Phase(
            name="Phase IV -- Redeployment",
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
    """Build Pacific Fury -- 26th MEU Pre-Deployment Training and Embark."""
    units = create_unit_states_for_scenario("pacific_fury")
    return Scenario(
        name="pacific_fury",
        display_name="Pacific Fury",
        description="26th MEU Pre-Deployment Training and Embark, Camp Lejeune",
        start_time=datetime(2026, 6, 1, 6, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 10, 13, 18, 0, tzinfo=timezone.utc),
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
    """Build Iron Forge -- III MEF Garrison Steady-State Operations, Okinawa."""
    units = create_unit_states_for_scenario("iron_forge")
    return Scenario(
        name="iron_forge",
        display_name="Iron Forge",
        description="III MEF Garrison Steady-State Operations, Okinawa",
        start_time=datetime(2026, 9, 15, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 12, 14, 0, 0, tzinfo=timezone.utc),
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


# ---------------------------------------------------------------------------
# NEW SCENARIOS
# ---------------------------------------------------------------------------


def _build_itx() -> Scenario:
    """Integrated Training Exercise -- 2/5 Battalion ITX at 29 Palms, 19 days."""
    start = datetime(2026, 4, 7, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=19)
    units = create_unit_states_for_scenario("itx")
    return Scenario(
        name="itx",
        display_name="Integrated Training Exercise",
        description=(
            "19-day battalion ITX at 29 Palms MCAGCC. 2/5 Marines with CLB-5 "
            "support. Full-spectrum training from MOUT to live-fire assault."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase 0 -- RSOI & Assembly",
                0,
                48,
                "LOW",
                "Reception, staging, onward movement, integration at MCAGCC.",
            ),
            Phase(
                "Phase I -- Garrison Training",
                48,
                72,
                "MEDIUM",
                "Ranges, MOUT, combined-arms rehearsals at Camp Wilson.",
            ),
            Phase(
                "Phase II -- Force-on-Force",
                120,
                96,
                "HIGH",
                "Live opposing force engagement across Coyote corridor.",
            ),
            Phase(
                "Phase III -- Live Fire & Maneuver",
                216,
                96,
                "HIGH",
                "BN live-fire attack with artillery and CAS integration.",
            ),
            Phase(
                "Phase IV -- Sustainment Ops",
                312,
                72,
                "MEDIUM",
                "LOGEX: contested resupply, convoy ops, CASEVAC rehearsal.",
            ),
            Phase(
                "Phase V -- Redeployment",
                384,
                72,
                "LOW",
                "AAR, equipment turn-in, redeploy to Camp Pendleton.",
            ),
        ],
        units=units,
    )


def _build_steel_knight() -> Scenario:
    """Steel Knight -- 1st MarDiv division-level exercise, SoCal, 14 days."""
    start = datetime(2026, 12, 1, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("steel_knight")
    return Scenario(
        name="steel_knight",
        display_name="Exercise Steel Knight",
        description=(
            "14-day 1st MarDiv division-level exercise across SoCal training "
            "areas. Multi-regiment maneuver with full logistics tail."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase 0 -- Assembly & Planning",
                0,
                24,
                "LOW",
                "Division staff planning, unit assembly at staging areas.",
            ),
            Phase(
                "Phase I -- Shaping Operations",
                24,
                48,
                "MEDIUM",
                "Recon, counter-recon, intel preparation of battlespace.",
            ),
            Phase(
                "Phase II -- Decisive Action",
                72,
                120,
                "HIGH",
                "Multi-regiment offensive operations across SoCal.",
            ),
            Phase(
                "Phase III -- Consolidation",
                192,
                72,
                "MEDIUM",
                "Consolidate gains, reset logistics, prepare for defense.",
            ),
            Phase(
                "Phase IV -- Redeployment",
                264,
                72,
                "LOW",
                "Division-level AAR, redeploy to home stations.",
            ),
        ],
        units=units,
    )


def _build_meu_comptuex() -> Scenario:
    """MEU COMPTUEX -- 24th MEU deployment certification, 14 days."""
    start = datetime(2026, 5, 1, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("comptuex")
    return Scenario(
        name="comptuex",
        display_name="24th MEU COMPTUEX",
        description=(
            "14-day Composite Training Unit Exercise for 24th MEU deployment "
            "certification. Integrated naval operations off Camp Lejeune."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Integration",
                0,
                48,
                "LOW",
                "MEU-ARG integration, comms checks, shipboard drills.",
            ),
            Phase(
                "Phase II -- Amphibious Operations",
                48,
                72,
                "HIGH",
                "Ship-to-shore movement, amphibious assault, TRAP.",
            ),
            Phase(
                "Phase III -- Sustained Ops Ashore",
                120,
                96,
                "HIGH",
                "NEO, HADR, raid, airfield seizure, MIO vignettes.",
            ),
            Phase(
                "Phase IV -- Reembark & Recovery",
                216,
                48,
                "MEDIUM",
                "Tactical withdrawal, retrograde, equipment accountability.",
            ),
            Phase(
                "Phase V -- Certification Review",
                264,
                72,
                "LOW",
                "Final AAR, certification brief, liberty call.",
            ),
        ],
        units=units,
    )


def _build_cobra_gold() -> Scenario:
    """Cobra Gold -- Multinational FTX in Thailand, 12 days."""
    start = datetime(2026, 2, 24, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=12)
    units = create_unit_states_for_scenario("cobra_gold")
    return Scenario(
        name="cobra_gold",
        display_name="Exercise Cobra Gold",
        description=(
            "12-day US-Thailand multinational exercise at Sattahip/Rayong. "
            "Combined amphibious, HADR, and jungle warfare training."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Reception & Bilateral Planning",
                0,
                48,
                "LOW",
                "Arrive Utapao, bilateral planning conferences, RSTA.",
            ),
            Phase(
                "Phase II -- Amphibious Landing",
                48,
                48,
                "HIGH",
                "Combined amphibious assault on Sattahip training beach.",
            ),
            Phase(
                "Phase III -- HADR",
                96,
                72,
                "MEDIUM",
                "Humanitarian assistance / disaster relief exercise.",
            ),
            Phase(
                "Phase IV -- Jungle Warfare",
                168,
                72,
                "HIGH",
                "Combined jungle patrol and survival training at Rayong.",
            ),
            Phase(
                "Phase V -- Closing Ceremony",
                240,
                48,
                "LOW",
                "AAR, equipment retrograde, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_balikatan() -> Scenario:
    """Balikatan -- US-Philippines bilateral EABO exercise, 19 days."""
    start = datetime(2026, 4, 14, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=19)
    units = create_unit_states_for_scenario("balikatan")
    return Scenario(
        name="balikatan",
        display_name="Exercise Balikatan",
        description=(
            "19-day US-Philippines bilateral exercise focused on EABO, "
            "island defense, and maritime domain awareness in Luzon Strait."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Arrival & Integration",
                0,
                48,
                "LOW",
                "Arrive Fort Magsaysay, joint planning, comms integration.",
            ),
            Phase(
                "Phase II -- EABO Establishment",
                48,
                96,
                "MEDIUM",
                "Expeditionary advanced base operations on Batan Island.",
            ),
            Phase(
                "Phase III -- Live Fire",
                144,
                72,
                "HIGH",
                "Combined live-fire exercise at Crow Valley and coastal "
                "defense missile firing.",
            ),
            Phase(
                "Phase IV -- Maritime ISR",
                216,
                96,
                "MEDIUM",
                "Maritime surveillance, reconnaissance, and small-boat ops.",
            ),
            Phase(
                "Phase V -- Retrograde",
                312,
                144,
                "LOW",
                "Equipment retrograde, AAR, closing ceremony at Camp Aguinaldo.",
            ),
        ],
        units=units,
    )


def _build_resolute_dragon() -> Scenario:
    """Resolute Dragon -- US-Japan bilateral exercise, 14 days."""
    start = datetime(2026, 10, 14, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("resolute_dragon")
    return Scenario(
        name="resolute_dragon",
        display_name="Exercise Resolute Dragon",
        description=(
            "14-day US-Japan bilateral exercise on Okinawa and mainland Japan. "
            "Combined arms, EABO, and amphibious integration with JGSDF."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Bilateral Planning",
                0,
                48,
                "LOW",
                "Joint planning at Camp Hansen, orders development.",
            ),
            Phase(
                "Phase II -- Combined Arms Training",
                48,
                72,
                "MEDIUM",
                "Combined-arms live fire at NTA and Camp Fuji.",
            ),
            Phase(
                "Phase III -- EABO Integration",
                120,
                96,
                "HIGH",
                "Expeditionary base operations on Ie Shima with JGSDF.",
            ),
            Phase(
                "Phase IV -- Amphibious Ops",
                216,
                72,
                "HIGH",
                "Combined amphibious assault rehearsal, ship-to-shore.",
            ),
            Phase(
                "Phase V -- Recovery & AAR",
                288,
                48,
                "LOW",
                "Equipment recovery, bilateral AAR, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_ssang_yong() -> Scenario:
    """Ssang Yong -- US-ROK combined amphibious exercise, 14 days."""
    start = datetime(2026, 3, 17, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("ssang_yong")
    return Scenario(
        name="ssang_yong",
        display_name="Exercise Ssang Yong",
        description=(
            "14-day US-ROK combined amphibious exercise at Pohang, South Korea. "
            "Large-scale ship-to-shore movement with ROK Marine Corps."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- At-Sea Staging",
                0,
                48,
                "LOW",
                "Naval task force assembly, pre-assault rehearsals.",
            ),
            Phase(
                "Phase II -- Amphibious Assault",
                48,
                72,
                "HIGH",
                "Combined amphibious assault on Pohang/Dokseok beaches.",
            ),
            Phase(
                "Phase III -- Maneuver Ashore",
                120,
                96,
                "HIGH",
                "Inland advance to seize objectives Alpha and Bravo.",
            ),
            Phase(
                "Phase IV -- Sustainment Exercise",
                216,
                48,
                "MEDIUM",
                "Contested logistics, CASEVAC, resupply under fire.",
            ),
            Phase(
                "Phase V -- Reembark",
                264,
                72,
                "LOW",
                "Tactical withdrawal to beach, reembark, AAR.",
            ),
        ],
        units=units,
    )


def _build_kamandag() -> Scenario:
    """Kamandag -- US-Philippines maritime exercise, 12 days."""
    start = datetime(2026, 10, 7, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=12)
    units = create_unit_states_for_scenario("kamandag")
    return Scenario(
        name="kamandag",
        display_name="Exercise Kamandag",
        description=(
            "12-day US-Philippines maritime exercise focused on amphibious "
            "operations, counterterrorism, and humanitarian assistance."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Opening & Integration",
                0,
                48,
                "LOW",
                "Opening ceremony, bilateral planning, comms integration.",
            ),
            Phase(
                "Phase II -- Amphibious Training",
                48,
                72,
                "MEDIUM",
                "Small-boat raids, beach reconnaissance, amphibious demos.",
            ),
            Phase(
                "Phase III -- Combined FTX",
                120,
                96,
                "HIGH",
                "Combined field training exercise with Philippine Marines.",
            ),
            Phase(
                "Phase IV -- HADR & Closing",
                216,
                72,
                "MEDIUM",
                "Humanitarian assistance exercise, AAR, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_valiant_shield() -> Scenario:
    """Valiant Shield -- Joint exercise in Guam/Marianas, 13 days."""
    start = datetime(2026, 6, 9, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=13)
    units = create_unit_states_for_scenario("valiant_shield")
    return Scenario(
        name="valiant_shield",
        display_name="Exercise Valiant Shield",
        description=(
            "13-day joint force exercise in the Mariana Islands. "
            "Integrated joint fires, anti-access/area denial, and EABO."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Joint Force Assembly",
                0,
                48,
                "LOW",
                "Force flow to Guam, joint planning, ISR setup.",
            ),
            Phase(
                "Phase II -- Distributed Maritime Ops",
                48,
                72,
                "MEDIUM",
                "Distributed operations across Tinian, Saipan, Rota.",
            ),
            Phase(
                "Phase III -- Joint Fires Integration",
                120,
                96,
                "HIGH",
                "Live-fire sink exercise, integrated joint fires.",
            ),
            Phase(
                "Phase IV -- EABO & Sustainment",
                216,
                72,
                "HIGH",
                "Expeditionary basing, contested logistics, at-sea resupply.",
            ),
            Phase(
                "Phase V -- Recovery",
                288,
                24,
                "LOW",
                "Equipment recovery, joint AAR.",
            ),
        ],
        units=units,
    )


def _build_rimpac() -> Scenario:
    """RIMPAC -- Multinational exercise off Hawaii, 38 days."""
    start = datetime(2026, 6, 29, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=38)
    units = create_unit_states_for_scenario("rimpac")
    return Scenario(
        name="rimpac",
        display_name="RIMPAC 2026",
        description=(
            "38-day multinational Rim of the Pacific exercise off Hawaii. "
            "Largest international maritime exercise with 25+ nations."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Harbor Phase",
                0,
                7 * 24,
                "LOW",
                "Force reception, multinational planning, harbor training.",
            ),
            Phase(
                "Phase II -- At-Sea Training",
                7 * 24,
                7 * 24,
                "MEDIUM",
                "Basic phase: seamanship, comms, basic warfare drills.",
            ),
            Phase(
                "Phase III -- Combined Ops",
                14 * 24,
                7 * 24,
                "HIGH",
                "Combined amphibious assault, live fire, SINKEX prep.",
            ),
            Phase(
                "Phase IV -- Free Play",
                21 * 24,
                7 * 24,
                "HIGH",
                "Free-play warfare scenarios, SINKEX, integrated fires.",
            ),
            Phase(
                "Phase V -- Amphibious Landing",
                28 * 24,
                5 * 24,
                "HIGH",
                "Combined amphibious landing at Bellows Beach / PMRF.",
            ),
            Phase(
                "Phase VI -- Recovery & Closing",
                33 * 24,
                5 * 24,
                "LOW",
                "Equipment recovery, multinational AAR, distinguished "
                "visitor day, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_african_lion() -> Scenario:
    """African Lion -- Morocco/Africa multinational exercise, 22 days."""
    start = datetime(2026, 6, 8, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=22)
    units = create_unit_states_for_scenario("african_lion")
    return Scenario(
        name="african_lion",
        display_name="Exercise African Lion",
        description=(
            "22-day multinational exercise in Morocco. Combined arms, "
            "amphibious operations, HADR, and command post exercise."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Deployment & Reception",
                0,
                72,
                "LOW",
                "Deploy to Morocco, reception at Agadir and Ben Guerir.",
            ),
            Phase(
                "Phase II -- Combined Ground Ops",
                72,
                120,
                "MEDIUM",
                "Combined arms maneuver, live fire at Tan Tan range.",
            ),
            Phase(
                "Phase III -- Amphibious Demonstration",
                192,
                96,
                "HIGH",
                "Amphibious landing demonstration on Agadir beach.",
            ),
            Phase(
                "Phase IV -- HADR Exercise",
                288,
                72,
                "MEDIUM",
                "Humanitarian assistance scenario at simulated disaster site.",
            ),
            Phase(
                "Phase V -- Retrograde",
                360,
                168,
                "LOW",
                "Equipment retrograde, multinational AAR, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_cold_response() -> Scenario:
    """Cold Response -- NATO Arctic exercise in Norway, 14 days."""
    start = datetime(2026, 3, 3, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("cold_response")
    return Scenario(
        name="cold_response",
        display_name="Exercise Cold Response",
        description=(
            "14-day NATO Arctic exercise in northern Norway. "
            "Cold-weather amphibious operations and mountain warfare."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Cold Weather Prep",
                0,
                48,
                "LOW",
                "Arrive Harstad, cold-weather equipment issue, acclimatization.",
            ),
            Phase(
                "Phase II -- Amphibious Landing",
                48,
                72,
                "HIGH",
                "Amphibious assault on northern beaches near Senja Island.",
            ),
            Phase(
                "Phase III -- Mountain Advance",
                120,
                96,
                "HIGH",
                "Advance through mountain passes toward Narvik objectives.",
            ),
            Phase(
                "Phase IV -- Sustainment in Arctic",
                216,
                72,
                "MEDIUM",
                "Contested resupply in Arctic conditions, CASEVAC on snow.",
            ),
            Phase(
                "Phase V -- Withdrawal & AAR",
                288,
                48,
                "LOW",
                "Tactical withdrawal, equipment recovery, NATO AAR.",
            ),
        ],
        units=units,
    )


def _build_native_fury() -> Scenario:
    """Native Fury -- CENTCOM exercise in UAE, 14 days."""
    start = datetime(2026, 3, 23, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=14)
    units = create_unit_states_for_scenario("native_fury")
    return Scenario(
        name="native_fury",
        display_name="Exercise Native Fury",
        description=(
            "14-day CENTCOM bilateral exercise in UAE. Desert amphibious "
            "operations and combined arms at Al Hamra training area."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Reception",
                0,
                48,
                "LOW",
                "Arrive UAE, bilateral planning, desert acclimatization.",
            ),
            Phase(
                "Phase II -- Amphibious Demonstration",
                48,
                72,
                "HIGH",
                "Amphibious landing demonstration at Ras Al Khaimah coast.",
            ),
            Phase(
                "Phase III -- Combined Arms",
                120,
                96,
                "HIGH",
                "Combined arms live fire at Al Hamra training area.",
            ),
            Phase(
                "Phase IV -- Sustainment Ops",
                216,
                72,
                "MEDIUM",
                "Desert logistics operations, water resupply drill.",
            ),
            Phase(
                "Phase V -- Redeployment",
                288,
                48,
                "LOW",
                "Equipment washdown, retrograde, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_unitas() -> Scenario:
    """UNITAS -- Chile maritime partnership exercise, 12 days."""
    start = datetime(2026, 7, 13, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=12)
    units = create_unit_states_for_scenario("unitas")
    return Scenario(
        name="unitas",
        display_name="Exercise UNITAS",
        description=(
            "12-day US-Chile maritime partnership exercise at Valparaiso. "
            "Combined naval, amphibious, and maritime security operations."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Port Phase",
                0,
                48,
                "LOW",
                "Arrive Valparaiso, combined planning, port activities.",
            ),
            Phase(
                "Phase II -- At-Sea Training",
                48,
                72,
                "MEDIUM",
                "Combined maritime patrol, boarding ops, communications.",
            ),
            Phase(
                "Phase III -- Amphibious Landing",
                120,
                72,
                "HIGH",
                "Combined amphibious assault rehearsal at Concon Beach.",
            ),
            Phase(
                "Phase IV -- Closing",
                192,
                96,
                "LOW",
                "Return to port, combined AAR, closing ceremony.",
            ),
        ],
        units=units,
    )


def _build_reserve_itx() -> Scenario:
    """Reserve ITX -- Reserve component ITX at 29 Palms, 19 days."""
    start = datetime(2026, 7, 6, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=19)
    units = create_unit_states_for_scenario("reserve_itx")
    return Scenario(
        name="reserve_itx",
        display_name="Reserve ITX",
        description=(
            "19-day Reserve component Integrated Training Exercise at 29 Palms. "
            "23rd Marines regiment with reserve logistics and artillery support."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase 0 -- Mobilization & RSOI",
                0,
                72,
                "LOW",
                "Reserve units mobilize, convoy to MCAGCC, draw equipment.",
            ),
            Phase(
                "Phase I -- Individual / Collective Training",
                72,
                72,
                "MEDIUM",
                "Marksmanship, land nav, squad and platoon exercises.",
            ),
            Phase(
                "Phase II -- Force-on-Force",
                144,
                96,
                "HIGH",
                "BN force-on-force against OPFOR in Coyote training area.",
            ),
            Phase(
                "Phase III -- Live Fire",
                240,
                72,
                "HIGH",
                "Combined-arms live fire with artillery and CAS.",
            ),
            Phase(
                "Phase IV -- LOGEX",
                312,
                48,
                "MEDIUM",
                "Contested logistics exercise, convoy defense drills.",
            ),
            Phase(
                "Phase V -- Demobilization",
                360,
                96,
                "LOW",
                "Equipment turn-in, AAR, demobilization processing.",
            ),
        ],
        units=units,
    )


def _build_island_sentinel() -> Scenario:
    """Island Sentinel -- EABO exercise along First Island Chain, 21 days."""
    start = datetime(2026, 11, 3, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=21)
    units = create_unit_states_for_scenario("island_sentinel")
    return Scenario(
        name="island_sentinel",
        display_name="Exercise Island Sentinel",
        description=(
            "21-day EABO exercise along the First Island Chain. MLR-focused "
            "distributed operations, anti-ship fires, and contested logistics."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Force Closure",
                0,
                72,
                "LOW",
                "Deploy to EAB sites on Miyako-jima, Yonaguni, Amami-Oshima.",
            ),
            Phase(
                "Phase II -- EAB Establishment",
                72,
                96,
                "MEDIUM",
                "Establish expeditionary advanced bases, sensor networks.",
            ),
            Phase(
                "Phase III -- Maritime Strike",
                168,
                96,
                "HIGH",
                "Anti-ship missile engagement sequences, relocate and shoot.",
            ),
            Phase(
                "Phase IV -- Contested Logistics",
                264,
                96,
                "HIGH",
                "Logistics under fire: at-sea connectors, aerial resupply.",
            ),
            Phase(
                "Phase V -- Retrograde",
                360,
                144,
                "LOW",
                "Displace from EABs, consolidate at Okinawa, AAR.",
            ),
        ],
        units=units,
    )


def _build_trident_spear() -> Scenario:
    """Trident Spear -- Crisis response and NEO exercise, 15 days."""
    start = datetime(2026, 8, 4, 6, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=15)
    units = create_unit_states_for_scenario("trident_spear")
    return Scenario(
        name="trident_spear",
        display_name="Exercise Trident Spear",
        description=(
            "15-day crisis response exercise. 13th MEU conducts NEO, HADR, "
            "and embassy reinforcement from at-sea staging."
        ),
        start_time=start,
        end_time=end,
        phases=[
            Phase(
                "Phase I -- Alert & At-Sea Staging",
                0,
                48,
                "MEDIUM",
                "Receive alert order, at-sea staging, mission planning.",
            ),
            Phase(
                "Phase II -- NEO Execution",
                48,
                72,
                "HIGH",
                "Embassy reinforcement, helicopter evacuation of civilians.",
            ),
            Phase(
                "Phase III -- HADR",
                120,
                96,
                "HIGH",
                "Humanitarian assistance at disaster site, medical triage.",
            ),
            Phase(
                "Phase IV -- Security Operations",
                216,
                72,
                "MEDIUM",
                "Perimeter security, civil-military operations, transition.",
            ),
            Phase(
                "Phase V -- Withdrawal",
                288,
                72,
                "LOW",
                "Phased withdrawal to ships, AAR, reset.",
            ),
        ],
        units=units,
    )


# ---------------------------------------------------------------------------
# Scenario catalog
# ---------------------------------------------------------------------------

_SCENARIO_CATALOG: dict[str, typing.Callable[[], Scenario]] = {
    "steel_guardian": _build_steel_guardian,
    "pacific_fury": _build_pacific_fury,
    "iron_forge": _build_iron_forge,
    "itx": _build_itx,
    "steel_knight": _build_steel_knight,
    "comptuex": _build_meu_comptuex,
    "cobra_gold": _build_cobra_gold,
    "balikatan": _build_balikatan,
    "resolute_dragon": _build_resolute_dragon,
    "ssang_yong": _build_ssang_yong,
    "kamandag": _build_kamandag,
    "valiant_shield": _build_valiant_shield,
    "rimpac": _build_rimpac,
    "african_lion": _build_african_lion,
    "cold_response": _build_cold_response,
    "native_fury": _build_native_fury,
    "unitas": _build_unitas,
    "reserve_itx": _build_reserve_itx,
    "island_sentinel": _build_island_sentinel,
    "trident_spear": _build_trident_spear,
}


def get_scenario(name: str) -> Scenario:
    """Load a scenario by name.

    Raises:
        ValueError: If the scenario name is not recognized.
    """
    builder = _SCENARIO_CATALOG.get(name)
    if builder is None:
        available = ", ".join(sorted(_SCENARIO_CATALOG.keys()))
        raise ValueError(f"Unknown scenario '{name}'. Available scenarios: {available}")
    return builder()


def list_scenarios() -> list[dict[str, str]]:
    """Return a summary of all available scenarios."""
    results = []
    for name, builder in sorted(_SCENARIO_CATALOG.items()):
        scenario = builder()
        results.append(
            {
                "name": scenario.name,
                "display_name": scenario.display_name,
                "description": scenario.description,
                "duration": f"{scenario.duration_hours:.0f} hours",
                "phases": str(len(scenario.phases)),
                "units": str(len(scenario.units)),
            }
        )
    return results
