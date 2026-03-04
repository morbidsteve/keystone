"""Event handler dispatch — processes each event type and returns follow-on events
plus data payloads for the feeders.

Each handler mutates UnitState in place and returns:
  (new_events, data_payloads)
where data_payloads are dicts with keys: type, channel (for mirc), content, unit, etc.
"""

from __future__ import annotations

import logging
import random
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from simulator.events.event_types import EventType
from simulator.events.event_queue import SimEvent
from simulator.units import COMMON_FAULTS, SupplyClass

if TYPE_CHECKING:
    from simulator.clock import SimulationClock
    from simulator.engine import SimulationState

logger = logging.getLogger("simulator.events")


async def handle_event(
    event: SimEvent,
    state: "SimulationState",
    clock: "SimulationClock",
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Dispatch an event to the appropriate handler.

    Returns:
        Tuple of (new_events_to_schedule, data_payloads_for_feeders).
    """
    handler = _HANDLERS.get(event.event_type)
    if handler is None:
        logger.warning(f"[SIM {clock.format()}] No handler for {event.event_type}")
        return [], []
    return await handler(event, state, clock)


# ---------------------------------------------------------------------------
# Individual handlers
# ---------------------------------------------------------------------------


async def _handle_supply_consumption(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Consume supplies for all units, check thresholds, reschedule."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []
    hours = event.data.get("hours", 1.0)

    for unit in state.units:
        unit.consume_supplies(hours)

        # Check for RED supply items — trigger emergency resupply
        for item in unit.supply_items:
            if item.status == "RED" and random.random() < 0.4:
                logger.info(
                    f"[SIM {clock.format()}] {unit.abbreviation} {item.name} "
                    f"is RED ({item.dos:.1f} DOS) — requesting emergency resupply"
                )
                new_events.append(
                    SimEvent(
                        fire_at=clock.now + timedelta(minutes=random.randint(10, 30)),
                        event_type=EventType.EMERGENCY_RESUPPLY,
                        unit_id=unit.abbreviation,
                        priority=2,
                        data={
                            "supply_class": item.supply_class.value,
                            "item_name": item.name,
                            "dos": item.dos,
                        },
                    )
                )
                payloads.append({
                    "type": "mirc",
                    "channel": "BN LOG NET",
                    "content": (
                        f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
                        f"FLASH — {item.name} at {item.dos:.1f} DOS. "
                        f"Request emergency resupply class {item.supply_class.value}. "
                        f"Current on-hand: {item.on_hand:.0f} {item.unit_of_measure}."
                    ),
                    "unit": unit.abbreviation,
                    "timestamp": clock.now.isoformat(),
                })

    # Reschedule next consumption tick
    new_events.append(
        SimEvent(
            fire_at=clock.now + timedelta(hours=1),
            event_type=EventType.SUPPLY_CONSUMPTION,
            unit_id="ALL",
            priority=7,
            data={"hours": 1.0},
        )
    )
    return new_events, payloads


async def _handle_emergency_resupply(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Trigger a resupply convoy from CLB to the requesting unit."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []

    unit = state.get_unit(event.unit_id)
    if unit is None:
        return new_events, payloads

    convoy_id = f"EMRSP-{random.randint(1000, 9999)}"
    sp_time = clock.now + timedelta(minutes=random.randint(30, 90))

    new_events.append(
        SimEvent(
            fire_at=sp_time,
            event_type=EventType.CONVOY_SP,
            unit_id=event.unit_id,
            priority=3,
            data={
                "convoy_id": convoy_id,
                "origin": "CLB-1",
                "destination": unit.abbreviation,
                "supply_class": event.data.get("supply_class", "III"),
            },
        )
    )

    payloads.append({
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] LOGPAC {convoy_id} tasked for emergency resupply to "
            f"{unit.abbreviation}. SP time {sp_time:%H%MZ}. "
            f"Class {event.data.get('supply_class', 'III')} priority."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    })
    return new_events, payloads


async def _handle_equipment_breakdown(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Break a piece of equipment, spawn recovery and repair chain."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []

    unit = state.get_unit(event.unit_id)
    if unit is None:
        return new_events, payloads

    # Pick a random MC equipment item to break
    mc_items = [
        (cat, item)
        for cat in unit.equipment_categories
        for item in cat.items
        if item.status == "MC"
    ]
    if not mc_items:
        return new_events, payloads

    cat, broken = random.choice(mc_items)
    fault = random.choice(COMMON_FAULTS)
    is_nmcs = random.random() < 0.4  # 40% supply, 60% maintenance
    broken.status = "NMCS" if is_nmcs else "NMCM"
    broken.fault_description = fault

    logger.info(
        f"[SIM {clock.format()}] {unit.abbreviation} — {broken.nomenclature} "
        f"({broken.serial}) now {broken.status}: {fault}"
    )

    # Spawn RECOVERY_OP if unit is in the field (not at main base)
    if unit.position != (34.2367, -116.0560):
        new_events.append(
            SimEvent(
                fire_at=clock.now + timedelta(hours=random.uniform(1, 4)),
                event_type=EventType.RECOVERY_OP,
                unit_id=unit.abbreviation,
                priority=4,
                data={"serial": broken.serial, "nomenclature": broken.nomenclature},
            )
        )

    # Spawn PARTS_ORDERED
    new_events.append(
        SimEvent(
            fire_at=clock.now + timedelta(hours=random.uniform(2, 8)),
            event_type=EventType.PARTS_ORDERED,
            unit_id=unit.abbreviation,
            priority=5,
            data={
                "serial": broken.serial,
                "nomenclature": broken.nomenclature,
                "fault": fault,
                "status": broken.status,
            },
        )
    )

    # Parts received 24-72 hours after order
    parts_eta = timedelta(hours=random.uniform(24, 72))
    new_events.append(
        SimEvent(
            fire_at=clock.now + parts_eta,
            event_type=EventType.PARTS_RECEIVED,
            unit_id=unit.abbreviation,
            priority=5,
            data={"serial": broken.serial, "nomenclature": broken.nomenclature},
        )
    )

    # Equipment repaired 6-48 hours after parts
    repair_time = parts_eta + timedelta(hours=random.uniform(6, 48))
    broken.ecd = clock.now + repair_time
    new_events.append(
        SimEvent(
            fire_at=clock.now + repair_time,
            event_type=EventType.EQUIPMENT_REPAIRED,
            unit_id=unit.abbreviation,
            priority=5,
            data={"serial": broken.serial, "nomenclature": broken.nomenclature},
        )
    )

    payloads.append({
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
            f"EQUIP DEADLINE: {broken.nomenclature} SN {broken.serial} — "
            f"{broken.status}. Fault: {fault}. "
            f"ECD: {broken.ecd:%d%b%y %H%MZ}. "
            f"{cat.nomenclature} readiness now {cat.readiness_pct:.0f}%."
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    })
    return new_events, payloads


async def _handle_parts_ordered(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log that parts have been ordered for a deadlined item."""
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[IRONHORSE 4] Parts ordered for {event.data.get('nomenclature', '?')} "
            f"SN {event.data.get('serial', '?')} ({event.unit_id}). "
            f"Fault: {event.data.get('fault', 'unknown')}. Tracking initiated."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_parts_received(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log parts receipt."""
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[IRONHORSE 4] Parts received for {event.data.get('nomenclature', '?')} "
            f"SN {event.data.get('serial', '?')} ({event.unit_id}). "
            f"Forwarding to maintenance platoon."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_equipment_repaired(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Mark equipment as MC again."""
    payloads: list[dict[str, Any]] = []
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], payloads

    serial = event.data.get("serial", "")
    for cat in unit.equipment_categories:
        for item in cat.items:
            if item.serial == serial:
                item.status = "MC"
                item.fault_description = None
                item.ecd = None
                logger.info(
                    f"[SIM {clock.format()}] {unit.abbreviation} — "
                    f"{item.nomenclature} ({serial}) repaired, now MC"
                )
                payloads.append({
                    "type": "mirc",
                    "channel": "BN LOG NET",
                    "content": (
                        f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
                        f"EQUIP UPDATE: {item.nomenclature} SN {serial} repaired — "
                        f"now MC. {cat.nomenclature} readiness {cat.readiness_pct:.0f}%."
                    ),
                    "unit": unit.abbreviation,
                    "timestamp": clock.now.isoformat(),
                })
                return [], payloads
    return [], payloads


async def _handle_recovery_op(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log a recovery operation dispatched for a deadlined vehicle."""
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] Recovery team dispatched for "
            f"{event.data.get('nomenclature', '?')} SN {event.data.get('serial', '?')} "
            f"at {event.unit_id} position. ETA 2-4 hours."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_convoy_sp(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Convoy has departed start point. Schedule checkpoints and arrival."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []
    convoy_id = event.data.get("convoy_id", "UNKNOWN")
    destination = event.data.get("destination", "?")

    # 1-3 checkpoints en route
    num_checkpoints = random.randint(1, 3)
    for i in range(num_checkpoints):
        cp_time = clock.now + timedelta(
            minutes=random.randint(20, 45) * (i + 1)
        )
        new_events.append(
            SimEvent(
                fire_at=cp_time,
                event_type=EventType.CONVOY_CHECKPOINT,
                unit_id=event.unit_id,
                priority=6,
                data={
                    "convoy_id": convoy_id,
                    "checkpoint": i + 1,
                    "total_checkpoints": num_checkpoints,
                },
            )
        )

    # Arrival
    arrival_time = clock.now + timedelta(
        hours=random.uniform(2, 5)
    )

    # Possible delay (20% chance)
    if random.random() < 0.2:
        delay_minutes = random.randint(15, 90)
        delay_time = clock.now + timedelta(
            minutes=random.randint(30, 90)
        )
        new_events.append(
            SimEvent(
                fire_at=delay_time,
                event_type=EventType.CONVOY_DELAYED,
                unit_id=event.unit_id,
                priority=3,
                data={
                    "convoy_id": convoy_id,
                    "delay_minutes": delay_minutes,
                    "reason": random.choice([
                        "IED threat — route clearance in progress",
                        "Vehicle breakdown in convoy",
                        "Route congestion at checkpoint",
                        "Sandstorm — reduced visibility",
                        "Detour required — obstacle on MSR",
                    ]),
                },
            )
        )
        arrival_time += timedelta(minutes=delay_minutes)

    new_events.append(
        SimEvent(
            fire_at=arrival_time,
            event_type=EventType.CONVOY_ARRIVED,
            unit_id=event.unit_id,
            priority=4,
            data={
                "convoy_id": convoy_id,
                "supply_class": event.data.get("supply_class", ""),
            },
        )
    )

    # Schedule delivery 30 min after arrival
    new_events.append(
        SimEvent(
            fire_at=arrival_time + timedelta(minutes=30),
            event_type=EventType.RESUPPLY_DELIVERY,
            unit_id=event.unit_id,
            priority=4,
            data={
                "convoy_id": convoy_id,
                "supply_class": event.data.get("supply_class", ""),
            },
        )
    )

    payloads.append({
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] LOGPAC {convoy_id} SP time NOW. "
            f"En route to {destination}. {num_checkpoints} checkpoints. "
            f"ETA {arrival_time:%H%MZ}."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    })
    return new_events, payloads


async def _handle_convoy_checkpoint(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log convoy passing a checkpoint."""
    convoy_id = event.data.get("convoy_id", "?")
    cp = event.data.get("checkpoint", "?")
    total = event.data.get("total_checkpoints", "?")
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] LOGPAC {convoy_id} checkpoint {cp}/{total}. "
            f"All vehicles accounted for. Proceeding."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_convoy_arrived(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log convoy arrival at destination."""
    convoy_id = event.data.get("convoy_id", "?")
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] LOGPAC {convoy_id} arrived at {event.unit_id}. "
            f"Commencing offload."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_convoy_delayed(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Log a convoy delay."""
    convoy_id = event.data.get("convoy_id", "?")
    reason = event.data.get("reason", "unknown cause")
    delay = event.data.get("delay_minutes", 0)
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "MSR NET",
        "content": (
            f"[IRONHORSE 3] WARNING — LOGPAC {convoy_id} delayed ~{delay} min. "
            f"Reason: {reason}. Will advise updated ETA."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_resupply_delivery(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Deliver supplies to the unit — increase on-hand quantities."""
    payloads: list[dict[str, Any]] = []
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], payloads

    supply_class_str = event.data.get("supply_class", "")
    try:
        sc = SupplyClass(supply_class_str)
    except ValueError:
        # Deliver a mix of everything
        for sc_val in SupplyClass:
            unit.resupply(sc_val, random.uniform(500, 2000))
        payloads.append({
            "type": "mirc",
            "channel": "BN LOG NET",
            "content": (
                f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
                f"LOGPAC received. General resupply complete. Updating LOGSTAT."
            ),
            "unit": unit.abbreviation,
            "timestamp": clock.now.isoformat(),
        })
        return [], payloads

    # Targeted resupply
    amount_map = {
        SupplyClass.I: random.uniform(200, 500),
        SupplyClass.III: random.uniform(2000, 5000),
        SupplyClass.V: random.uniform(5000, 20000),
        SupplyClass.VIII: random.uniform(50, 150),
        SupplyClass.IX: random.uniform(30, 80),
    }
    amount = amount_map.get(sc, 1000)
    unit.resupply(sc, amount)

    payloads.append({
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
            f"Class {sc.value} resupply received from "
            f"LOGPAC {event.data.get('convoy_id', '?')}. Updating LOGSTAT."
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    })
    return [], payloads


async def _handle_resupply_convoy(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Plan and dispatch a resupply convoy (non-emergency, scheduled)."""
    convoy_id = f"LOGPAC-{random.randint(1000, 9999)}"
    sp_time = clock.now + timedelta(minutes=random.randint(60, 180))
    new_events = [
        SimEvent(
            fire_at=sp_time,
            event_type=EventType.CONVOY_SP,
            unit_id=event.unit_id,
            priority=5,
            data={
                "convoy_id": convoy_id,
                "origin": "CLB-1",
                "destination": event.unit_id,
                "supply_class": event.data.get("supply_class", ""),
            },
        )
    ]
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[IRONHORSE 3] Scheduled LOGPAC {convoy_id} for {event.unit_id}. "
            f"SP time {sp_time:%H%MZ}."
        ),
        "unit": "CLB-1",
        "timestamp": clock.now.isoformat(),
    }]
    return new_events, payloads


async def _handle_convoy_planned(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Announce a planned convoy."""
    convoy_id = event.data.get("convoy_id", f"PLAN-{random.randint(1000, 9999)}")
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[RAIDER 4] Convoy {convoy_id} planned for {event.unit_id}. "
            f"Coordinating with CLB-1 for execution."
        ),
        "unit": "1/1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_phase_change(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Transition the exercise to a new phase, update tempo for all units."""
    new_phase = event.data.get("phase_name", "UNKNOWN")
    new_tempo = event.data.get("tempo", "MEDIUM")

    for unit in state.units:
        unit.current_tempo = new_tempo

    logger.info(
        f"[SIM {clock.format()}] === PHASE CHANGE: {new_phase} "
        f"(tempo: {new_tempo}) ==="
    )

    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[RAIDER 6] ALL STATIONS — PHASE TRANSITION to {new_phase}. "
            f"Op tempo now {new_tempo}. Acknowledge."
        ),
        "unit": "1/1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_unit_displaced(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Move a unit to a new position."""
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], []

    new_pos = event.data.get("new_position")
    if new_pos:
        unit.position = tuple(new_pos)

    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
            f"Displacement complete. Set at new pos. REDCON 1."
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    }, {
        "type": "tak",
        "unit": unit.abbreviation,
        "position": unit.position,
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_mass_casualty(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Handle a mass casualty event — spike medical supply consumption."""
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], []

    # Consume medical supplies aggressively
    for item in unit.supply_items:
        if item.supply_class == SupplyClass.VIII:
            item.on_hand = max(0, item.on_hand - item.daily_consumption_rate * 3)

    num_casualties = event.data.get("casualties", random.randint(3, 12))
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
            f"MASCAL MASCAL MASCAL — {num_casualties}x casualties. "
            f"Request CASEVAC and Class VIII resupply. "
            f"Current medical status: "
            + ", ".join(
                f"{i.name}: {i.status}"
                for i in unit.supply_items
                if i.supply_class == SupplyClass.VIII
            )
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    }]

    # Trigger emergency medical resupply
    new_events = [
        SimEvent(
            fire_at=clock.now + timedelta(minutes=15),
            event_type=EventType.EMERGENCY_RESUPPLY,
            unit_id=unit.abbreviation,
            priority=1,
            data={"supply_class": "VIII", "item_name": "Medical Supplies"},
        )
    ]
    return new_events, payloads


async def _handle_increased_tempo(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Increase a unit's operational tempo."""
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], []
    unit.current_tempo = "HIGH"
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[RAIDER 3] {unit.abbreviation} — increased op tempo to HIGH. "
            f"Expect higher consumption rates."
        ),
        "unit": "1/1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_decreased_tempo(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Decrease a unit's operational tempo."""
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], []
    unit.current_tempo = "LOW"
    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[RAIDER 3] {unit.abbreviation} — decreased op tempo to LOW. "
            f"Consolidation phase."
        ),
        "unit": "1/1",
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_logstat_due(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Generate LOGSTAT data when the reporting window hits."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []

    unit = state.get_unit(event.unit_id)
    if unit is None:
        return new_events, payloads

    unit.last_logstat = clock.now

    # Build LOGSTAT summary for mIRC
    lines = [f"LOGSTAT {unit.abbreviation} DTG {clock.now:%d%H%MZ%b%y}".upper()]
    for item in unit.supply_items:
        lines.append(
            f"  CL {item.supply_class.value} {item.name}: "
            f"{item.on_hand:.0f}/{item.required:.0f} {item.unit_of_measure} "
            f"({item.dos:.1f} DOS) [{item.status}]"
        )
    logstat_text = "\n".join(lines)

    payloads.append({
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}]\n"
            f"{logstat_text}"
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    })

    # Also generate an Excel-style payload
    payloads.append({
        "type": "excel",
        "report_type": "logstat",
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
        "data": {
            "unit_name": unit.unit_name,
            "abbreviation": unit.abbreviation,
            "dtg": clock.now.isoformat(),
            "items": [
                {
                    "name": item.name,
                    "class": item.supply_class.value,
                    "uom": item.unit_of_measure,
                    "on_hand": item.on_hand,
                    "required": item.required,
                    "dos": item.dos,
                    "status": item.status,
                    "pct": item.percentage,
                }
                for item in unit.supply_items
            ],
        },
    })

    # Reschedule next LOGSTAT in 12 hours
    new_events.append(
        SimEvent(
            fire_at=clock.now + timedelta(hours=12),
            event_type=EventType.LOGSTAT_DUE,
            unit_id=unit.abbreviation,
            priority=6,
        )
    )
    return new_events, payloads


async def _handle_sitrep_due(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Generate a situation report."""
    unit = state.get_unit(event.unit_id)
    if unit is None:
        return [], []

    # Count RED items
    red_items = [i for i in unit.supply_items if i.status == "RED"]
    amber_items = [i for i in unit.supply_items if i.status == "AMBER"]
    avg_readiness = (
        sum(c.readiness_pct for c in unit.equipment_categories)
        / max(len(unit.equipment_categories), 1)
    )

    payloads: list[dict[str, Any]] = [{
        "type": "mirc",
        "channel": "BN TAC 1",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}] "
            f"SITREP {clock.now:%d%H%MZ%b%y}: "
            f"Tempo {unit.current_tempo}. "
            f"Supply: {len(red_items)} RED, {len(amber_items)} AMBER. "
            f"Equip readiness: {avg_readiness:.0f}%. "
            f"Active convoys: {len(unit.active_convoys)}."
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    }]
    return [], payloads


async def _handle_readiness_report_due(
    event: SimEvent, state: "SimulationState", clock: "SimulationClock"
) -> tuple[list[SimEvent], list[dict[str, Any]]]:
    """Generate equipment readiness report."""
    new_events: list[SimEvent] = []
    payloads: list[dict[str, Any]] = []

    unit = state.get_unit(event.unit_id)
    if unit is None:
        return new_events, payloads

    unit.last_equip_report = clock.now

    lines = [f"READINESS REPORT {unit.abbreviation} DTG {clock.now:%d%H%MZ%b%y}".upper()]
    for cat in unit.equipment_categories:
        lines.append(
            f"  {cat.nomenclature} ({cat.tamcn}): "
            f"MC {cat.mission_capable}/{cat.total_possessed} "
            f"NMCM {cat.nmcm} NMCS {cat.nmcs} "
            f"({cat.readiness_pct:.0f}%)"
        )
    report_text = "\n".join(lines)

    payloads.append({
        "type": "mirc",
        "channel": "BN LOG NET",
        "content": (
            f"[{unit.callsigns[0] if unit.callsigns else unit.abbreviation}]\n"
            f"{report_text}"
        ),
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
    })

    payloads.append({
        "type": "excel",
        "report_type": "readiness",
        "unit": unit.abbreviation,
        "timestamp": clock.now.isoformat(),
        "data": {
            "unit_name": unit.unit_name,
            "abbreviation": unit.abbreviation,
            "dtg": clock.now.isoformat(),
            "categories": [
                {
                    "tamcn": cat.tamcn,
                    "nomenclature": cat.nomenclature,
                    "total": cat.total_possessed,
                    "mc": cat.mission_capable,
                    "nmcm": cat.nmcm,
                    "nmcs": cat.nmcs,
                    "readiness_pct": cat.readiness_pct,
                }
                for cat in unit.equipment_categories
            ],
        },
    })

    # Reschedule in 24 hours
    new_events.append(
        SimEvent(
            fire_at=clock.now + timedelta(hours=24),
            event_type=EventType.READINESS_REPORT_DUE,
            unit_id=unit.abbreviation,
            priority=6,
        )
    )
    return new_events, payloads


# ---------------------------------------------------------------------------
# Handler dispatch table
# ---------------------------------------------------------------------------

_HANDLERS: dict = {
    EventType.SUPPLY_CONSUMPTION: _handle_supply_consumption,
    EventType.EMERGENCY_RESUPPLY: _handle_emergency_resupply,
    EventType.RESUPPLY_CONVOY: _handle_resupply_convoy,
    EventType.RESUPPLY_DELIVERY: _handle_resupply_delivery,
    EventType.EQUIPMENT_BREAKDOWN: _handle_equipment_breakdown,
    EventType.PARTS_ORDERED: _handle_parts_ordered,
    EventType.PARTS_RECEIVED: _handle_parts_received,
    EventType.EQUIPMENT_REPAIRED: _handle_equipment_repaired,
    EventType.RECOVERY_OP: _handle_recovery_op,
    EventType.CONVOY_PLANNED: _handle_convoy_planned,
    EventType.CONVOY_SP: _handle_convoy_sp,
    EventType.CONVOY_CHECKPOINT: _handle_convoy_checkpoint,
    EventType.CONVOY_ARRIVED: _handle_convoy_arrived,
    EventType.CONVOY_DELAYED: _handle_convoy_delayed,
    EventType.PHASE_CHANGE: _handle_phase_change,
    EventType.UNIT_DISPLACED: _handle_unit_displaced,
    EventType.MASS_CASUALTY: _handle_mass_casualty,
    EventType.INCREASED_TEMPO: _handle_increased_tempo,
    EventType.DECREASED_TEMPO: _handle_decreased_tempo,
    EventType.LOGSTAT_DUE: _handle_logstat_due,
    EventType.SITREP_DUE: _handle_sitrep_due,
    EventType.READINESS_REPORT_DUE: _handle_readiness_report_due,
}
