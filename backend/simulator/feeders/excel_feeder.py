"""Feed generated Excel files to KEYSTONE ingestion endpoint."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from simulator.feeders.base import SimulatorClient

logger = logging.getLogger("simulator.feeders.excel")


async def feed_excel(
    client: "SimulatorClient",
    units: list,
    clock: Any,
    stats: dict[str, int],
) -> None:
    """Generate and push Excel reports for units due for reporting.

    Two report types are produced:

    * **LOGSTAT** — every 12 hours (supply status by class).
    * **Equipment readiness** — every 24 hours.

    Each report is generated via ``simulator.generators.excel`` and uploaded to
    the KEYSTONE ``/api/v1/ingestion/excel`` endpoint.

    Args:
        client: Authenticated :class:`SimulatorClient`.
        units: List of unit objects with ``logstat_due`` / ``equip_report_due``
            methods and ``abbreviation``, ``last_logstat``, ``last_equip_report``
            attributes.
        clock: Simulator clock providing a ``now`` property.
        stats: Mutable dict for accumulating feeder counters.
    """
    from simulator.generators.excel import (
        generate_equipment_excel,
        generate_logstat_excel,
    )

    for unit in units:
        # ---- LOGSTAT (every 12 hours) -----------------------------------
        if unit.logstat_due(clock.now):
            logstat_bytes = generate_logstat_excel(unit, clock.now)
            filename = (
                f"SIM_LOGSTAT_"
                f"{unit.abbreviation.replace(' ', '_').replace('/', '-')}_"
                f"{clock.now.strftime('%d%H%MZ%b%Y').upper()}.xlsx"
            )
            try:
                await client.post_excel(logstat_bytes, filename)
                logger.info(
                    "[SIM %s] Posted Excel LOGSTAT: %s",
                    clock.now.strftime("%Y-%m-%d %H:%MZ"),
                    filename,
                )
                unit.last_logstat = clock.now
                stats["excel_posts"] = stats.get("excel_posts", 0) + 1
            except Exception:
                logger.exception("Failed to post Excel %s", filename)

        # ---- Equipment readiness (every 24 hours) -----------------------
        if unit.equip_report_due(clock.now):
            equip_bytes = generate_equipment_excel(unit, clock.now)
            equip_filename = (
                f"SIM_EQUIP_"
                f"{unit.abbreviation.replace(' ', '_').replace('/', '-')}_"
                f"{clock.now.strftime('%d%H%MZ%b%Y').upper()}.xlsx"
            )
            try:
                await client.post_excel(equip_bytes, equip_filename)
                logger.info(
                    "[SIM %s] Posted Excel equipment: %s",
                    clock.now.strftime("%Y-%m-%d %H:%MZ"),
                    equip_filename,
                )
                unit.last_equip_report = clock.now
                stats["excel_posts"] = stats.get("excel_posts", 0) + 1
            except Exception:
                logger.exception("Failed to post Excel %s", equip_filename)
