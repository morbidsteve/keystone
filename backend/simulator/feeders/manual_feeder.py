"""Feed manual-entry data to KEYSTONE supply / equipment / transportation endpoints."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from simulator.feeders.base import SimulatorClient

logger = logging.getLogger("simulator.feeders.manual")

# Mapping from payload type tag to KEYSTONE POST endpoint.
_ENDPOINT_MAP: dict[str, str] = {
    "supply": "/api/v1/supply/",
    "equipment": "/api/v1/equipment/",
    "transportation": "/api/v1/transportation/",
}


async def feed_manual_entry(
    client: "SimulatorClient",
    payload: dict[str, Any],
    stats: dict[str, int],
) -> dict[str, Any] | None:
    """Post a manual-entry payload to the appropriate KEYSTONE endpoint.

    The *payload* must contain a ``"type"`` key whose value is one of
    ``"supply"``, ``"equipment"``, or ``"transportation"``.  The ``"data"``
    key holds the actual record fields matching the corresponding Pydantic
    ``*Create`` schema.

    Example payload::

        {
            "type": "supply",
            "data": {
                "unit_id": 3,
                "supply_class": "III",
                "item_description": "JP-8 (bulk)",
                "on_hand_qty": 4200.0,
                "required_qty": 6000.0,
                "dos": 2.1,
                "consumption_rate": 2000.0,
                "status": "AMBER",
                "source": "simulator",
            },
        }

    Args:
        client: Authenticated :class:`SimulatorClient`.
        payload: Dict with ``type`` and ``data`` keys.
        stats: Mutable dict for accumulating feeder counters.

    Returns:
        The JSON response from KEYSTONE, or ``None`` on failure.
    """
    entry_type = payload.get("type", "")
    endpoint = _ENDPOINT_MAP.get(entry_type)

    if endpoint is None:
        logger.error(
            "Unknown manual-entry type %r — expected one of %s",
            entry_type,
            list(_ENDPOINT_MAP.keys()),
        )
        return None

    data = payload.get("data")
    if not data:
        logger.error("Manual-entry payload has no 'data' key: %s", payload)
        return None

    try:
        result = await client.post_json(endpoint, data)
        logger.info(
            "Posted manual %s entry to %s — id=%s",
            entry_type,
            endpoint,
            result.get("id", "?"),
        )
        stats["manual_posts"] = stats.get("manual_posts", 0) + 1
        return result
    except Exception:
        logger.exception("Failed to post manual %s entry", entry_type)
        return None
