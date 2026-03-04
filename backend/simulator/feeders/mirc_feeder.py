"""Feed generated mIRC logs to KEYSTONE ingestion endpoint."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from simulator.feeders.base import SimulatorClient

logger = logging.getLogger("simulator.feeders.mirc")


async def feed_mirc(
    client: "SimulatorClient",
    units: list,
    clock: Any,
    stats: dict[str, int],
    scenario_name: str = "steel_guardian",
) -> None:
    """Generate and push mIRC log batches for all active channels.

    For each unique channel found across *units*, a 30-minute log window is
    generated via ``simulator.generators.mirc`` and uploaded to the KEYSTONE
    ``/api/v1/ingestion/mirc`` endpoint.

    Args:
        client: Authenticated :class:`SimulatorClient`.
        units: List of unit objects (must expose a ``channels`` attribute).
        clock: Simulator clock providing a ``now`` property.
        stats: Mutable dict for accumulating feeder counters.
        scenario_name: Scenario name for channel configuration lookup.
    """
    from simulator.generators.mirc import generate_mirc_log_batch

    # Collect unique channels across all units
    channels: set[str] = set()
    for unit in units:
        channels.update(unit.channels)

    for channel in sorted(channels):
        # Gather units participating on this channel
        channel_units = [u for u in units if channel in u.channels]

        window_end = clock.now
        window_start = window_end - timedelta(minutes=30)

        log_content = generate_mirc_log_batch(
            channel, channel_units, window_start, window_end, scenario_name
        )

        if not log_content.strip():
            logger.debug("Empty mIRC log for %s — skipping", channel)
            continue

        clean_channel = channel.replace("#", "")
        filename = f"SIM_{clean_channel}_{window_end.strftime('%Y%m%d_%H%M')}.log"

        try:
            await client.post_mirc_log(log_content, channel, filename)
            logger.info(
                "[SIM %s] Posted mIRC log: %s (%d bytes)",
                clock.now.strftime("%Y-%m-%d %H:%MZ"),
                filename,
                len(log_content),
            )
            stats["mirc_posts"] = stats.get("mirc_posts", 0) + 1
        except Exception:
            logger.exception("Failed to post mIRC log %s", filename)
