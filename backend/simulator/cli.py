"""CLI interface for the KEYSTONE simulator.

Usage:
    python -m simulator run --scenario=steel_guardian --speed=60
    python -m simulator list

Environment variable overrides:
    SIM_SPEED       -- simulation speed multiplier (default: 60)
    SIM_SCENARIO    -- scenario name (default: steel_guardian)
    KEYSTONE_URL    -- KEYSTONE API base URL (default: http://localhost:8000)
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
        description="KEYSTONE Mock Data Simulator -- generates realistic logistics data streams.",
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


# Scenario categorization for the list command
_SCENARIO_CATEGORIES: list[tuple[str, list[str]]] = [
    (
        "Pre-Deployment Training (CONUS)",
        ["steel_guardian", "itx", "steel_knight", "comptuex"],
    ),
    (
        "Indo-Pacific",
        [
            "cobra_gold",
            "balikatan",
            "resolute_dragon",
            "ssang_yong",
            "kamandag",
            "valiant_shield",
            "rimpac",
            "island_sentinel",
        ],
    ),
    (
        "Europe / Africa / Middle East",
        ["african_lion", "cold_response", "native_fury"],
    ),
    (
        "Americas / Maritime",
        ["unitas"],
    ),
    (
        "Crisis Response",
        ["trident_spear"],
    ),
    (
        "Reserve Component",
        ["reserve_itx"],
    ),
    (
        "Deployment / Garrison",
        ["pacific_fury", "iron_forge"],
    ),
]


def cmd_list() -> None:
    """Print available scenarios grouped by category."""
    scenarios = list_scenarios()
    scenario_map = {s["name"]: s for s in scenarios}

    print("\nAvailable Scenarios")
    print("=" * 90)

    for category, names in _SCENARIO_CATEGORIES:
        print(f"\n{category}:")
        for name in names:
            s = scenario_map.get(name)
            if s is None:
                continue
            days = int(float(s["duration"].replace(" hours", "")) / 24)
            desc_short = s["description"]
            if len(desc_short) > 55:
                desc_short = desc_short[:52] + "..."
            print(f"  {name:<20} {desc_short:<56} [{days}d, {s['units']}u]")

    # Print any scenarios not in a category (safety net)
    categorized = {n for _, names in _SCENARIO_CATEGORIES for n in names}
    uncategorized = [s for s in scenarios if s["name"] not in categorized]
    if uncategorized:
        print("\nOther:")
        for s in uncategorized:
            days = int(float(s["duration"].replace(" hours", "")) / 24)
            print(f"  {s['name']:<20} {s['description'][:56]:<56} [{days}d]")

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
    logger.info(
        f"Starting simulator: scenario={config.scenario_name}, speed={config.speed}x"
    )

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
