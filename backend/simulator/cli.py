"""CLI interface for the KEYSTONE simulator.

Usage:
    python -m simulator run --scenario=steel_guardian --speed=60
    python -m simulator list

Environment variable overrides:
    SIM_SPEED       — simulation speed multiplier (default: 60)
    SIM_SCENARIO    — scenario name (default: steel_guardian)
    KEYSTONE_URL    — KEYSTONE API base URL (default: http://localhost:8000)
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys

from simulator.config import SimulatorConfig
from simulator.engine import run_simulation
from simulator.scenario import list_scenarios


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the simulator CLI."""
    parser = argparse.ArgumentParser(
        prog="simulator",
        description="KEYSTONE Mock Data Simulator — generates realistic logistics data streams.",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # --- run ---
    run_parser = subparsers.add_parser("run", help="Run a simulation scenario")
    run_parser.add_argument(
        "--scenario",
        type=str,
        default=os.environ.get("SIM_SCENARIO", "steel_guardian"),
        help="Scenario name (default: steel_guardian, env: SIM_SCENARIO)",
    )
    run_parser.add_argument(
        "--speed",
        type=float,
        default=float(os.environ.get("SIM_SPEED", "60")),
        help="Speed multiplier (default: 60, env: SIM_SPEED)",
    )
    run_parser.add_argument(
        "--url",
        type=str,
        default=os.environ.get("KEYSTONE_URL", "http://localhost:8000"),
        help="KEYSTONE API base URL (default: http://localhost:8000, env: KEYSTONE_URL)",
    )
    run_parser.add_argument(
        "--username",
        type=str,
        default="simulator",
        help="API username (default: simulator)",
    )
    run_parser.add_argument(
        "--password",
        type=str,
        default=os.environ.get("SIM_PASSWORD", ""),
        help="API password (env: SIM_PASSWORD)",
    )
    run_parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Log level (default: INFO)",
    )
    run_parser.add_argument(
        "--max-events-per-tick",
        type=int,
        default=50,
        help="Max events processed per tick (default: 50)",
    )

    # --- list ---
    subparsers.add_parser("list", help="List available scenarios")

    return parser


def configure_logging(level: str) -> None:
    """Set up structured logging."""
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )


def cmd_list() -> None:
    """Print available scenarios."""
    scenarios = list_scenarios()
    print(f"\n{'Name':<20} {'Display Name':<35} {'Duration':<12} {'Phases':<8} {'Units':<8}")
    print("-" * 90)
    for s in scenarios:
        print(
            f"{s['name']:<20} {s['display_name']:<35} "
            f"{s['duration']:<12} {s['phases']:<8} {s['units']:<8}"
        )
    print()


def cmd_run(args: argparse.Namespace) -> None:
    """Run the simulation with the given arguments."""
    configure_logging(args.log_level)

    config = SimulatorConfig(
        base_url=args.url,
        speed=args.speed,
        scenario_name=args.scenario,
        username=args.username,
        password=args.password,
        log_level=args.log_level,
        max_events_per_tick=args.max_events_per_tick,
    )

    logger = logging.getLogger("simulator.cli")
    logger.info(f"Starting simulator: scenario={config.scenario_name}, speed={config.speed}x")

    asyncio.run(run_simulation(config))


def main() -> None:
    """Entry point for the simulator CLI."""
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "list":
        cmd_list()
    elif args.command == "run":
        cmd_run(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
