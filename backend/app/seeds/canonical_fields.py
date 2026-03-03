"""Seed canonical fields for KEYSTONE schema mapping.

Run via:  python -m app.seeds.canonical_fields
or called from the app lifespan startup.
"""

import asyncio
import logging
from typing import List, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.canonical_schema import CanonicalField

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical field definitions — the single source of truth.
# ---------------------------------------------------------------------------

CANONICAL_FIELDS: List[Dict] = [
    # ===== Supply Status =====
    {
        "entity_name": "supply_status",
        "field_name": "unit_id",
        "display_name": "Unit ID",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Supply",
        "description": "Unit identifier or UIC",
    },
    {
        "entity_name": "supply_status",
        "field_name": "supply_class",
        "display_name": "Supply Class",
        "data_type": "enum",
        "is_required": True,
        "entity_group": "Supply",
        "description": "USMC supply class (I through X)",
        "enum_values": [
            "I",
            "II",
            "III",
            "IIIA",
            "IV",
            "V",
            "VI",
            "VII",
            "VIII",
            "IX",
            "X",
        ],
    },
    {
        "entity_name": "supply_status",
        "field_name": "item_description",
        "display_name": "Item Description",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Supply",
        "description": "Nomenclature or description of the supply item",
    },
    {
        "entity_name": "supply_status",
        "field_name": "on_hand_qty",
        "display_name": "On Hand Quantity",
        "data_type": "float",
        "is_required": True,
        "entity_group": "Supply",
        "description": "Current quantity on hand",
    },
    {
        "entity_name": "supply_status",
        "field_name": "required_qty",
        "display_name": "Required Quantity",
        "data_type": "float",
        "is_required": True,
        "entity_group": "Supply",
        "description": "Authorized or required quantity",
    },
    {
        "entity_name": "supply_status",
        "field_name": "dos",
        "display_name": "Days of Supply",
        "data_type": "float",
        "is_required": True,
        "entity_group": "Supply",
        "description": "Calculated days of supply at current consumption rate",
    },
    {
        "entity_name": "supply_status",
        "field_name": "consumption_rate",
        "display_name": "Consumption Rate",
        "data_type": "float",
        "is_required": False,
        "entity_group": "Supply",
        "description": "Daily consumption rate",
    },
    {
        "entity_name": "supply_status",
        "field_name": "status",
        "display_name": "Status",
        "data_type": "enum",
        "is_required": False,
        "entity_group": "Supply",
        "description": "Supply status color code",
        "enum_values": ["GREEN", "AMBER", "RED", "BLACK"],
    },
    # ===== Equipment Status =====
    {
        "entity_name": "equipment_status",
        "field_name": "unit_id",
        "display_name": "Unit ID",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Equipment",
        "description": "Unit identifier or UIC",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "tamcn",
        "display_name": "TAMCN",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Equipment",
        "description": "Table of Authorized Material Control Number",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "nomenclature",
        "display_name": "Nomenclature",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Equipment",
        "description": "Equipment name/type",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "total_possessed",
        "display_name": "Total Possessed",
        "data_type": "integer",
        "is_required": True,
        "entity_group": "Equipment",
        "description": "Total equipment count possessed by unit",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "mission_capable",
        "display_name": "Mission Capable",
        "data_type": "integer",
        "is_required": True,
        "entity_group": "Equipment",
        "description": "Number of items mission capable (MC)",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "nmcm",
        "display_name": "NMCM",
        "data_type": "integer",
        "is_required": False,
        "entity_group": "Equipment",
        "description": "Not Mission Capable - Maintenance",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "nmcs",
        "display_name": "NMCS",
        "data_type": "integer",
        "is_required": False,
        "entity_group": "Equipment",
        "description": "Not Mission Capable - Supply",
    },
    {
        "entity_name": "equipment_status",
        "field_name": "readiness_pct",
        "display_name": "Readiness %",
        "data_type": "float",
        "is_required": False,
        "entity_group": "Equipment",
        "description": "Percent mission capable (MC / Total Possessed)",
    },
    # ===== Movement =====
    {
        "entity_name": "movement",
        "field_name": "unit_id",
        "display_name": "Unit ID",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Movement",
        "description": "Unit identifier or UIC",
    },
    {
        "entity_name": "movement",
        "field_name": "convoy_id",
        "display_name": "Convoy ID",
        "data_type": "string",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Convoy or serial identifier",
    },
    {
        "entity_name": "movement",
        "field_name": "origin",
        "display_name": "Origin",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Movement",
        "description": "Departure location",
    },
    {
        "entity_name": "movement",
        "field_name": "destination",
        "display_name": "Destination",
        "data_type": "string",
        "is_required": True,
        "entity_group": "Movement",
        "description": "Arrival location",
    },
    {
        "entity_name": "movement",
        "field_name": "departure_time",
        "display_name": "Departure Time",
        "data_type": "datetime",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Scheduled or actual departure time",
    },
    {
        "entity_name": "movement",
        "field_name": "eta",
        "display_name": "ETA",
        "data_type": "datetime",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Estimated time of arrival",
    },
    {
        "entity_name": "movement",
        "field_name": "vehicle_count",
        "display_name": "Vehicle Count",
        "data_type": "integer",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Number of vehicles in movement",
    },
    {
        "entity_name": "movement",
        "field_name": "cargo_description",
        "display_name": "Cargo Description",
        "data_type": "string",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Description of cargo being transported",
    },
    {
        "entity_name": "movement",
        "field_name": "status",
        "display_name": "Status",
        "data_type": "enum",
        "is_required": False,
        "entity_group": "Movement",
        "description": "Movement status",
        "enum_values": ["PLANNED", "EN_ROUTE", "COMPLETE", "DELAYED", "CANCELLED"],
    },
]


async def seed_canonical_fields(session: AsyncSession) -> int:
    """Seed canonical fields if they don't already exist.

    Returns the number of new fields inserted.
    """
    existing = await session.execute(
        select(CanonicalField.entity_name, CanonicalField.field_name)
    )
    existing_keys = {(row[0], row[1]) for row in existing.all()}

    new_count = 0
    for field_def in CANONICAL_FIELDS:
        key = (field_def["entity_name"], field_def["field_name"])
        if key not in existing_keys:
            session.add(CanonicalField(**field_def))
            new_count += 1

    if new_count > 0:
        await session.flush()
        logger.info(f"Seeded {new_count} canonical fields.")
    else:
        logger.info("All canonical fields already present.")

    return new_count


async def run_seed() -> None:
    """Standalone entry point for seeding."""
    async with async_session() as session:
        count = await seed_canonical_fields(session)
        await session.commit()
        print(f"Seeded {count} canonical fields.")


if __name__ == "__main__":
    asyncio.run(run_seed())
