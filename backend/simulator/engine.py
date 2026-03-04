"""Main simulation engine — orchestrates clock, events, generators, and feeders.

The engine runs an async loop that:
1. Pops due events from the priority queue
2. Dispatches them to handlers (which mutate unit state and produce payloads)
3. Runs periodic generators (mIRC batches, Excel reports, TAK positions)
4. Passes payloads to feeders for delivery to the KEYSTONE API
5. Sleeps briefly between ticks
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from simulator.clock import SimulationClock
from simulator.config import SimulatorConfig
from simulator.events.event_handlers import handle_event
from simulator.events.event_queue import EventQueue
from simulator.scenario import Scenario, get_scenario
from simulator.units import UnitState

logger = logging.getLogger("simulator.engine")


@dataclass
class SimulationState:
    """Holds all mutable state for a running simulation."""

    scenario: Scenario
    clock: SimulationClock
    queue: EventQueue
    config: SimulatorConfig
    units: list[UnitState] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.units:
            self.units = list(self.scenario.units)

    def get_unit(self, abbreviation: str) -> Optional[UnitState]:
        """Look up a unit by its abbreviation (e.g., 'A/1/1')."""
        for unit in self.units:
            if unit.abbreviation == abbreviation:
                return unit
        return None


async def dispatch_payload(
    client: Any,
    payload: dict[str, Any],
    stats: dict[str, int],
) -> None:
    """Route a data payload to the appropriate feeder.

    Catches ImportError gracefully so the engine can run before feeders
    are fully implemented.
    """
    payload_type = payload.get("type", "unknown")

    try:
        if payload_type == "mirc":
            try:
                from simulator.feeders.mirc import post_mirc_message

                await post_mirc_message(client, payload)
            except ImportError:
                logger.debug("mIRC feeder not available — payload logged only")
            stats["mirc_posts"] = stats.get("mirc_posts", 0) + 1

        elif payload_type == "excel":
            try:
                from simulator.feeders.excel import post_excel_report

                await post_excel_report(client, payload)
            except ImportError:
                logger.debug("Excel feeder not available — payload logged only")
            stats["excel_posts"] = stats.get("excel_posts", 0) + 1

        elif payload_type == "tak":
            try:
                from simulator.feeders.tak import post_tak_position

                await post_tak_position(client, payload)
            except ImportError:
                logger.debug("TAK feeder not available — payload logged only")
            stats["tak_posts"] = stats.get("tak_posts", 0) + 1

        elif payload_type == "manual":
            try:
                from simulator.feeders.manual import post_manual_entry

                await post_manual_entry(client, payload)
            except ImportError:
                logger.debug("Manual feeder not available — payload logged only")
            stats["manual_posts"] = stats.get("manual_posts", 0) + 1

        else:
            logger.warning(f"Unknown payload type: {payload_type}")

    except Exception as e:
        logger.error(f"Failed to dispatch {payload_type} payload: {e}")


async def run_periodic_generators(
    state: SimulationState,
    client: Any,
    clock: SimulationClock,
    stats: dict[str, int],
) -> None:
    """Run periodic generators for mIRC batches, TAK positions, etc.

    Each generator checks its own timing internally and no-ops if not due.
    Catches ImportError so the engine runs before generators exist.
    """
    try:
        from simulator.generators.mirc_gen import maybe_generate_mirc_batch

        payloads = await maybe_generate_mirc_batch(state, clock)
        for p in payloads:
            await dispatch_payload(client, p, stats)
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"mIRC generator error: {e}")

    try:
        from simulator.generators.tak_gen import maybe_generate_tak_positions

        payloads = await maybe_generate_tak_positions(state, clock)
        for p in payloads:
            await dispatch_payload(client, p, stats)
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"TAK generator error: {e}")

    try:
        from simulator.generators.excel_gen import maybe_generate_excel_report

        payloads = await maybe_generate_excel_report(state, clock)
        for p in payloads:
            await dispatch_payload(client, p, stats)
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"Excel generator error: {e}")


async def run_simulation(config: SimulatorConfig) -> None:
    """Run the full simulation loop until scenario end or KeyboardInterrupt.

    Args:
        config: Simulator configuration with speed, scenario, URL, etc.
    """
    # Build scenario and state
    scenario = get_scenario(config.scenario_name)
    clock = SimulationClock(scenario.start_time, config.speed)
    queue = EventQueue()
    state = SimulationState(
        scenario=scenario,
        clock=clock,
        queue=queue,
        config=config,
    )

    # Schedule all initial events
    scenario.schedule_initial_events(queue, clock)

    # Attempt to authenticate with the KEYSTONE API
    client: Any = None
    _client_ctx = None
    try:
        from simulator.feeders.base import SimulatorClient

        _client_ctx = SimulatorClient(config.base_url, api_delay_ms=config.api_delay_ms)
        client = await _client_ctx.__aenter__()
        await client.authenticate(config.username, config.password)
        logger.info(f"[SIM {clock.format()}] Authenticated with KEYSTONE API")
    except ImportError:
        logger.warning(
            "Feeder base client not available — running in dry-run mode "
            "(events processed but not posted to API)"
        )
        _client_ctx = None
    except Exception as e:
        logger.warning(
            f"Could not authenticate with KEYSTONE API: {type(e).__name__} — "
            f"running in dry-run mode"
        )
        if _client_ctx:
            await _client_ctx.__aexit__(None, None, None)
            _client_ctx = None
        client = None

    logger.info(f"[SIM {clock.format()}] Simulation started: {scenario.display_name}")
    logger.info(
        f"[SIM {clock.format()}] Speed: {config.speed}x "
        f"(1 sim hour = {3600 / config.speed:.1f} real seconds)"
    )
    logger.info(
        f"[SIM {clock.format()}] Duration: {scenario.duration_hours:.0f} sim hours "
        f"({scenario.duration_hours / config.speed * 1:.1f} real seconds at current speed)"
    )
    logger.info(
        f"[SIM {clock.format()}] Units: {len(state.units)}, "
        f"Phases: {len(scenario.phases)}, "
        f"Initial events: {queue.total_scheduled}"
    )

    stats: dict[str, int] = {
        "events_processed": 0,
        "mirc_posts": 0,
        "excel_posts": 0,
        "tak_posts": 0,
        "manual_posts": 0,
        "ticks": 0,
    }

    try:
        while clock.now < scenario.end_time:
            due_events = queue.pop_due(clock.now)

            for event in due_events[: config.max_events_per_tick]:
                new_events, payloads = await handle_event(event, state, clock)
                for ne in new_events:
                    queue.schedule(ne)
                for payload in payloads:
                    await dispatch_payload(client, payload, stats)
                stats["events_processed"] += 1

            # Run periodic generators
            await run_periodic_generators(state, client, clock, stats)

            stats["ticks"] += 1

            # Log progress periodically (every 100 ticks)
            if stats["ticks"] % 100 == 0:
                logger.info(
                    f"[SIM {clock.format()}] Tick {stats['ticks']}: "
                    f"{stats['events_processed']} events, "
                    f"{len(queue)} queued, "
                    f"{stats['mirc_posts']} mIRC / "
                    f"{stats['excel_posts']} Excel / "
                    f"{stats['tak_posts']} TAK"
                )

            await asyncio.sleep(0.5)

    except KeyboardInterrupt:
        logger.info(f"[SIM {clock.format()}] Simulation interrupted by user")

    except Exception as e:
        logger.error(f"[SIM {clock.format()}] Simulation error: {e}", exc_info=True)

    finally:
        if _client_ctx:
            await _client_ctx.__aexit__(None, None, None)
        logger.info("=" * 60)
        logger.info("Simulation stopped. Summary:")
        logger.info(f"  Scenario:         {scenario.display_name}")
        logger.info(f"  Sim time reached: {clock.format()}")
        logger.info(f"  Real ticks:       {stats['ticks']}")
        for key, value in stats.items():
            if key != "ticks":
                logger.info(f"  {key:20s}: {value}")
        logger.info(f"  Events remaining: {len(queue)}")
        logger.info("=" * 60)
