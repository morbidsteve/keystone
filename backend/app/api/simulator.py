"""Simulator management endpoints: list scenarios, start/stop/pause simulations."""

from __future__ import annotations

import logging
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger("app.api.simulator")

# ---------------------------------------------------------------------------
# Module-level state for tracking a running simulation process
# ---------------------------------------------------------------------------

_sim_process: Optional[subprocess.Popen[str]] = None
_sim_meta: dict[str, Any] = {}  # scenario_name, speed, started_at, status


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class StartRequest(BaseModel):
    scenario_name: str
    speed: float = 60.0


class SpeedRequest(BaseModel):
    speed: float


# ---------------------------------------------------------------------------
# Helpers — import scenario module (it lives outside the app package)
# ---------------------------------------------------------------------------


def _get_scenario_module():
    """Lazily import the simulator.scenario module."""
    try:
        from simulator.scenario import get_scenario, list_scenarios

        return get_scenario, list_scenarios
    except ImportError as exc:
        raise HTTPException(
            status_code=501,
            detail=f"Simulator module not available: {exc}",
        )


def _get_areas_module():
    """Lazily import the simulator areas_of_operation module."""
    try:
        from simulator.areas_of_operation import SCENARIO_AO

        return SCENARIO_AO
    except ImportError:
        return {}


def _get_cli_categories():
    """Return scenario category mapping from the CLI module."""
    try:
        from simulator.cli import _SCENARIO_CATEGORIES

        return _SCENARIO_CATEGORIES
    except ImportError:
        return []


def _build_category_map() -> dict[str, str]:
    """Build a name -> category mapping from cli categories."""
    categories = _get_cli_categories()
    result: dict[str, str] = {}
    for category_name, names in categories:
        for name in names:
            result[name] = category_name
    return result


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/scenarios")
async def list_all_scenarios():
    """List all available simulation scenarios."""
    get_scenario, list_scenarios = _get_scenario_module()
    raw = list_scenarios()
    category_map = _build_category_map()

    results = []
    for s in raw:
        duration_str = s["duration"]  # e.g. "168 hours"
        hours = float(duration_str.replace(" hours", ""))
        results.append(
            {
                "name": s["name"],
                "display_name": s["display_name"],
                "description": s["description"],
                "duration_days": round(hours / 24, 1),
                "phase_count": int(s["phases"]),
                "unit_count": int(s["units"]),
                "category": category_map.get(s["name"], "Other"),
            }
        )

    return results


@router.get("/scenarios/{name}")
async def get_scenario_detail(name: str):
    """Get detailed information about a specific scenario."""
    get_scenario, _ = _get_scenario_module()
    scenario_ao = _get_areas_module()

    try:
        scenario = get_scenario(name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    category_map = _build_category_map()

    phases = []
    for p in scenario.phases:
        phases.append(
            {
                "name": p.name,
                "offset_h": p.start_offset_hours,
                "duration_h": p.duration_hours,
                "tempo": p.tempo,
                "description": p.description,
            }
        )

    units = []
    for u in scenario.units:
        units.append(
            {
                "name": u.unit_name,
                "type": u.echelon,
                "callsign": u.callsigns[0] if u.callsigns else u.abbreviation,
            }
        )

    ao_info = None
    ao_data = scenario_ao.get(name)
    if ao_data:
        center = ao_data.get("center")
        radius = ao_data.get("radius_km")
        if center and radius:
            ao_info = {
                "name": name.replace("_", " ").title(),
                "center": list(center) if isinstance(center, tuple) else center,
                "radius_km": radius,
            }

    return {
        "name": scenario.name,
        "display_name": scenario.display_name,
        "description": scenario.description,
        "duration_days": round(scenario.duration_hours / 24, 1),
        "phase_count": len(scenario.phases),
        "unit_count": len(scenario.units),
        "category": category_map.get(name, "Other"),
        "phases": phases,
        "units": units,
        "area_of_operation": ao_info,
    }


@router.post("/start")
async def start_simulation(req: StartRequest):
    """Start a simulation as a subprocess."""
    global _sim_process, _sim_meta

    if _sim_process is not None and _sim_process.poll() is None:
        raise HTTPException(
            status_code=409,
            detail="A simulation is already running. Stop it first.",
        )

    # Validate the scenario name before launching
    get_scenario, _ = _get_scenario_module()
    try:
        get_scenario(req.scenario_name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    # Launch as a subprocess using python -m simulator run
    cmd = [
        sys.executable,
        "-m",
        "simulator",
        "run",
        f"--scenario={req.scenario_name}",
        f"--speed={req.speed}",
        "--log-level=INFO",
    ]

    try:
        _sim_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(__import__("pathlib").Path(__file__).resolve().parents[2]),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start simulator process: {exc}",
        )

    started_at = datetime.now(timezone.utc).isoformat()
    _sim_meta = {
        "scenario_name": req.scenario_name,
        "speed": req.speed,
        "started_at": started_at,
        "status": "running",
    }

    logger.info(
        f"Simulator started: scenario={req.scenario_name}, speed={req.speed}x, pid={_sim_process.pid}"
    )

    return {
        "status": "running",
        "scenario_name": req.scenario_name,
        "speed": req.speed,
        "started_at": started_at,
    }


@router.post("/stop")
async def stop_simulation():
    """Stop the running simulation."""
    global _sim_process, _sim_meta

    if _sim_process is None or _sim_process.poll() is not None:
        _sim_meta["status"] = "stopped"
        return {"status": "stopped"}

    _sim_process.terminate()
    try:
        _sim_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        _sim_process.kill()

    _sim_meta["status"] = "stopped"
    logger.info("Simulator stopped")

    return {"status": "stopped"}


@router.post("/pause")
async def pause_simulation():
    """Pause the running simulation (sends SIGSTOP on Unix)."""
    global _sim_process, _sim_meta

    if _sim_process is None or _sim_process.poll() is not None:
        raise HTTPException(status_code=409, detail="No simulation is running.")

    import signal

    try:
        _sim_process.send_signal(signal.SIGSTOP)
        _sim_meta["status"] = "paused"
    except (OSError, AttributeError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cannot pause process: {exc}",
        )

    return {"status": "paused"}


@router.post("/resume")
async def resume_simulation():
    """Resume a paused simulation (sends SIGCONT on Unix)."""
    global _sim_process, _sim_meta

    if _sim_process is None or _sim_process.poll() is not None:
        raise HTTPException(status_code=409, detail="No simulation is running.")

    import signal

    try:
        _sim_process.send_signal(signal.SIGCONT)
        _sim_meta["status"] = "running"
    except (OSError, AttributeError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cannot resume process: {exc}",
        )

    return {"status": "running"}


@router.post("/speed")
async def set_speed(req: SpeedRequest):
    """Change simulation speed (note: only effective for new process starts)."""
    global _sim_meta
    _sim_meta["speed"] = req.speed
    return {"speed": req.speed}


@router.get("/status")
async def get_status():
    """Get the current simulation status."""
    global _sim_process, _sim_meta

    if _sim_process is None:
        return {"status": "idle"}

    # Check if process is still running
    poll = _sim_process.poll()
    if poll is not None:
        _sim_meta["status"] = "stopped"
        return {
            "status": "stopped",
            "scenario_name": _sim_meta.get("scenario_name"),
            "speed": _sim_meta.get("speed"),
            "started_at": _sim_meta.get("started_at"),
        }

    return {
        "status": _sim_meta.get("status", "running"),
        "scenario_name": _sim_meta.get("scenario_name"),
        "speed": _sim_meta.get("speed"),
        "started_at": _sim_meta.get("started_at"),
    }
