"""Simulator configuration.

All tunables live here. Values can be overridden via CLI flags or
environment variables (SIM_SPEED, SIM_SCENARIO, KEYSTONE_URL).
"""

import os
from dataclasses import dataclass, field


@dataclass
class SimulatorConfig:
    """Central configuration for a simulator run."""

    base_url: str = "http://localhost:8000"
    speed: float = 60.0
    scenario_name: str = "steel_guardian"
    api_delay_ms: int = 200  # Min ms between API calls
    username: str = "simulator"
    password: str = field(default_factory=lambda: os.environ.get("SIM_PASSWORD", ""))
    log_level: str = "INFO"
    mirc_batch_window_minutes: int = 30
    excel_report_interval_hours: int = 12
    tak_position_interval_seconds: int = 60
    max_events_per_tick: int = 50
