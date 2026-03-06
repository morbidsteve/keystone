"""Broadcast helper for pushing real-time events over WebSocket."""

from datetime import datetime, timezone


async def broadcast_event(event_type: str, data: dict):
    """Broadcast an event to all connected WebSocket clients.

    Parameters
    ----------
    event_type:
        A short label such as ``"work_order.created"`` or ``"alert.resolved"``.
    data:
        Arbitrary JSON-serialisable payload describing the event.
    """
    from app.api.ws import manager

    await manager.broadcast(
        {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
