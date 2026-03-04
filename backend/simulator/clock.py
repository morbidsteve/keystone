"""Simulated time management with configurable acceleration.

The SimulationClock maps wall-clock elapsed time to an accelerated simulation
timeline. At speed_multiplier=60.0, one real second equals one simulated minute.
Pause/resume is supported for debugging.
"""

from datetime import datetime, timedelta, timezone


class SimulationClock:
    """Tracks simulated time with configurable speed multiplier.

    Args:
        start_time: The datetime the simulation begins in sim-world.
        speed_multiplier: Ratio of sim-seconds to real-seconds.
            1.0   = real-time
            60.0  = 1 sim minute per real second (default)
            3600.0 = 1 sim hour per real second
    """

    def __init__(self, start_time: datetime, speed_multiplier: float = 60.0) -> None:
        self.start_time = start_time
        self.speed_multiplier = speed_multiplier
        self.real_start = datetime.now(timezone.utc)
        self._paused = False
        self._paused_at: datetime | None = None
        self._pause_offset = timedelta(0)

    @property
    def now(self) -> datetime:
        """Return the current simulated time."""
        if self._paused and self._paused_at is not None:
            return self._paused_at
        elapsed_real = (datetime.now(timezone.utc) - self.real_start).total_seconds()
        elapsed_sim = elapsed_real * self.speed_multiplier
        return self.start_time + timedelta(seconds=elapsed_sim) + self._pause_offset

    @property
    def is_paused(self) -> bool:
        return self._paused

    def pause(self) -> None:
        """Freeze simulation time at the current instant."""
        if not self._paused:
            self._paused = True
            self._paused_at = self.now

    def resume(self) -> None:
        """Resume simulation time from where it was paused."""
        if self._paused and self._paused_at is not None:
            # Calculate how much real time passed while paused — that real time
            # should NOT advance sim time, so we subtract the sim-equivalent.
            elapsed_real = (
                datetime.now(timezone.utc) - self.real_start
            ).total_seconds()
            elapsed_sim = elapsed_real * self.speed_multiplier
            expected_now = (
                self.start_time + timedelta(seconds=elapsed_sim) + self._pause_offset
            )
            drift = expected_now - self._paused_at
            self._pause_offset -= drift
            self._paused = False
            self._paused_at = None

    def set_speed(self, multiplier: float) -> None:
        """Change speed on the fly, preserving the current sim time."""
        current = self.now
        self.start_time = current
        self.real_start = datetime.now(timezone.utc)
        self._pause_offset = timedelta(0)
        self.speed_multiplier = multiplier

    def format(self, fmt: str = "%Y-%m-%d %H:%MZ") -> str:
        """Return formatted current sim time."""
        return self.now.strftime(fmt)
