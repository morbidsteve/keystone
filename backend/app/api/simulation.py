"""Living Simulation Engine control endpoints."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.permissions import require_role
from app.models.user import Role, User
from app.services.living_sim import (
    AVAILABLE_SCENARIOS,
    get_living_sim_engine,
)

router = APIRouter()


class SimStatusResponse(BaseModel):
    """Current simulation engine status."""

    running: bool
    scenario: str
    speed: int
    enabled: bool
    active_tasks: int
    multipliers: Dict[str, float]


class SpeedRequest(BaseModel):
    """Request to change simulation speed."""

    speed: int = Field(..., ge=1, le=7200, description="Speed multiplier (1=realtime)")


class ScenarioRequest(BaseModel):
    """Request to switch scenario."""

    scenario: str = Field(..., description="Scenario name")


class ScenarioInfo(BaseModel):
    """Info about an available scenario."""

    name: str
    multipliers: Dict[str, float]


@router.get("/status", response_model=SimStatusResponse)
async def get_sim_status(
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> Dict[str, Any]:
    """Get current simulation engine status."""
    engine = get_living_sim_engine()
    if engine is None:
        return {
            "running": False,
            "scenario": "Garrison",
            "speed": 60,
            "enabled": False,
            "active_tasks": 0,
            "multipliers": {},
        }
    return engine.get_status()


@router.post("/start", response_model=SimStatusResponse)
async def start_simulation(
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> Dict[str, Any]:
    """Start the living simulation engine."""
    engine = get_living_sim_engine()
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Living simulation engine is not initialized",
        )
    if engine.running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Simulation engine is already running",
        )
    await engine.start()
    return engine.get_status()


@router.post("/stop", response_model=SimStatusResponse)
async def stop_simulation(
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> Dict[str, Any]:
    """Stop the living simulation engine."""
    engine = get_living_sim_engine()
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Living simulation engine is not initialized",
        )
    if not engine.running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Simulation engine is not running",
        )
    await engine.stop()
    return engine.get_status()


@router.post("/speed", response_model=SimStatusResponse)
async def set_sim_speed(
    request: SpeedRequest,
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> Dict[str, Any]:
    """Update simulation speed multiplier."""
    engine = get_living_sim_engine()
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Living simulation engine is not initialized",
        )
    engine.config.speed = request.speed
    return engine.get_status()


@router.post("/scenario", response_model=SimStatusResponse)
async def set_sim_scenario(
    request: ScenarioRequest,
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> Dict[str, Any]:
    """Switch simulation scenario."""
    engine = get_living_sim_engine()
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Living simulation engine is not initialized",
        )
    if request.scenario not in AVAILABLE_SCENARIOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown scenario '{request.scenario}'. "
            f"Available: {AVAILABLE_SCENARIOS}",
        )
    engine.config.scenario = request.scenario
    return engine.get_status()


@router.get("/scenarios", response_model=List[ScenarioInfo])
async def list_scenarios(
    current_user: User = Depends(require_role([Role.ADMIN])),
) -> List[Dict[str, Any]]:
    """List available simulation scenarios with their multipliers."""
    from app.services.living_sim import SCENARIO_MULTIPLIERS

    return [
        {"name": name, "multipliers": mults}
        for name, mults in SCENARIO_MULTIPLIERS.items()
    ]
