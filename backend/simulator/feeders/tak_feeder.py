"""Feed generated TAK CoT events to KEYSTONE."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from simulator.feeders.base import SimulatorClient

logger = logging.getLogger("simulator.feeders.tak")

# Minimum interval between supply CoT reports for a single unit.
_SUPPLY_COT_INTERVAL = timedelta(hours=2)


async def feed_tak(
    client: "SimulatorClient",
    units: list,
    clock: Any,
    stats: dict[str, int],
) -> None:
    """Generate and push TAK CoT position and supply events.

    * **Position updates** are sent for every unit on each tick.
    * **Supply reports** via TAK are sent at most once every 2 hours per unit
      (controlled by ``unit.last_tak_supply``).

    Args:
        client: Authenticated :class:`SimulatorClient`.
        units: List of unit objects with ``abbreviation``, geographic state,
            and ``last_tak_supply`` attribute.
        clock: Simulator clock providing a ``now`` property.
        stats: Mutable dict for accumulating feeder counters.
    """
    from simulator.generators.tak import generate_position_cot, generate_supply_cot

    for unit in units:
        # ---- Position CoT (every tick) ----------------------------------
        try:
            position_xml = generate_position_cot(unit, clock.now)
            await client.post_tak_cot(position_xml)
            stats["tak_posts"] = stats.get("tak_posts", 0) + 1
        except Exception:
            logger.exception(
                "Failed to post TAK position for %s", unit.abbreviation
            )

        # ---- Supply CoT (throttled to every ~2 hours) -------------------
        last_supply = getattr(unit, "last_tak_supply", None)
        if last_supply is None or (clock.now - last_supply) >= _SUPPLY_COT_INTERVAL:
            try:
                supply_xml = generate_supply_cot(unit, clock.now)
                await client.post_tak_cot(supply_xml)
                unit.last_tak_supply = clock.now
                stats["tak_posts"] = stats.get("tak_posts", 0) + 1
                logger.info(
                    "[SIM %s] Posted TAK supply CoT for %s",
                    clock.now.strftime("%Y-%m-%d %H:%MZ"),
                    unit.abbreviation,
                )
            except Exception:
                logger.exception(
                    "Failed to post TAK supply CoT for %s", unit.abbreviation
                )
