"""Priority-queue based event scheduling.

Events are ordered by fire_at time, with priority as a tiebreaker (lower
numeric priority fires first).
"""

from __future__ import annotations

import heapq
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from simulator.events.event_types import EventType


@dataclass(order=True)
class SimEvent:
    """A single scheduled simulation event."""

    fire_at: datetime
    priority: int = 5  # 0 = highest, 9 = lowest
    event_type: EventType = field(compare=False, default=EventType.SUPPLY_CONSUMPTION)
    unit_id: str = field(compare=False, default="")
    data: dict[str, Any] = field(compare=False, default_factory=dict)
    event_id: str = field(compare=False, default_factory=lambda: uuid.uuid4().hex[:12])

    def __repr__(self) -> str:
        return (
            f"SimEvent({self.event_type.value}, unit={self.unit_id}, "
            f"at={self.fire_at:%H:%M:%S}, pri={self.priority})"
        )


class EventQueue:
    """Heap-based priority queue for simulation events."""

    def __init__(self) -> None:
        self._heap: list[SimEvent] = []
        self._count = 0

    def __len__(self) -> int:
        return len(self._heap)

    @property
    def empty(self) -> bool:
        return len(self._heap) == 0

    def schedule(self, event: SimEvent) -> None:
        """Add an event to the queue."""
        heapq.heappush(self._heap, event)
        self._count += 1

    def peek(self) -> SimEvent | None:
        """Look at the next event without removing it."""
        if self._heap:
            return self._heap[0]
        return None

    def pop_due(self, current_time: datetime) -> list[SimEvent]:
        """Remove and return all events whose fire_at <= current_time, in order."""
        due: list[SimEvent] = []
        while self._heap and self._heap[0].fire_at <= current_time:
            due.append(heapq.heappop(self._heap))
        return due

    @property
    def total_scheduled(self) -> int:
        """Total events ever scheduled (including already popped)."""
        return self._count
