"""Seed the unit hierarchy for KEYSTONE.

Creates:
  I MEF
  +-- 1st MarDiv
  |   +-- 1st Marines
  |   |   +-- 1/1 (1st Bn 1st Marines)
  |   |   |   +-- Alpha Co 1/1
  |   |   |   +-- Bravo Co 1/1
  |   |   |   +-- Charlie Co 1/1
  |   |   |   +-- Delta Co 1/1
  |   |   +-- 2/1 (2nd Bn 1st Marines)
  |   |   |   +-- Alpha Co 2/1
  |   |   |   +-- Bravo Co 2/1
  |   |   |   +-- Charlie Co 2/1
  |   |   |   +-- Delta Co 2/1
  |   |   +-- 3/1 (3rd Bn 1st Marines)
  |   |       +-- Alpha Co 3/1
  |   |       +-- Bravo Co 3/1
  |   |       +-- Charlie Co 3/1
  |   |       +-- Delta Co 3/1
  +-- 1st MLG
      +-- CLR-1
      +-- CLB-1
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.unit import Echelon, Unit


UNIT_HIERARCHY = {
    "I MEF": {
        "abbr": "I MEF",
        "echelon": Echelon.MEF,
        "uic": "M00001",
        "children": {
            "1st Marine Division": {
                "abbr": "1st MarDiv",
                "echelon": Echelon.DIV,
                "uic": "M01000",
                "children": {
                    "1st Marine Regiment": {
                        "abbr": "1st Marines",
                        "echelon": Echelon.REGT,
                        "uic": "M01100",
                        "children": {
                            "1st Bn 1st Marines": {
                                "abbr": "1/1",
                                "echelon": Echelon.BN,
                                "uic": "M01110",
                                "children": {
                                    "Alpha Company 1/1": {
                                        "abbr": "A Co 1/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01111",
                                    },
                                    "Bravo Company 1/1": {
                                        "abbr": "B Co 1/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01112",
                                    },
                                    "Charlie Company 1/1": {
                                        "abbr": "C Co 1/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01113",
                                    },
                                    "Delta Company 1/1": {
                                        "abbr": "D Co 1/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01114",
                                    },
                                },
                            },
                            "2nd Bn 1st Marines": {
                                "abbr": "2/1",
                                "echelon": Echelon.BN,
                                "uic": "M01120",
                                "children": {
                                    "Alpha Company 2/1": {
                                        "abbr": "A Co 2/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01121",
                                    },
                                    "Bravo Company 2/1": {
                                        "abbr": "B Co 2/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01122",
                                    },
                                    "Charlie Company 2/1": {
                                        "abbr": "C Co 2/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01123",
                                    },
                                    "Delta Company 2/1": {
                                        "abbr": "D Co 2/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01124",
                                    },
                                },
                            },
                            "3rd Bn 1st Marines": {
                                "abbr": "3/1",
                                "echelon": Echelon.BN,
                                "uic": "M01130",
                                "children": {
                                    "Alpha Company 3/1": {
                                        "abbr": "A Co 3/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01131",
                                    },
                                    "Bravo Company 3/1": {
                                        "abbr": "B Co 3/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01132",
                                    },
                                    "Charlie Company 3/1": {
                                        "abbr": "C Co 3/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01133",
                                    },
                                    "Delta Company 3/1": {
                                        "abbr": "D Co 3/1",
                                        "echelon": Echelon.CO,
                                        "uic": "M01134",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "1st Marine Logistics Group": {
                "abbr": "1st MLG",
                "echelon": Echelon.DIV,
                "uic": "M02000",
                "children": {
                    "Combat Logistics Regiment 1": {
                        "abbr": "CLR-1",
                        "echelon": Echelon.REGT,
                        "uic": "M02100",
                    },
                    "Combat Logistics Battalion 1": {
                        "abbr": "CLB-1",
                        "echelon": Echelon.BN,
                        "uic": "M02110",
                    },
                },
            },
        },
    },
}


async def create_unit_tree(db: AsyncSession, tree: dict, parent_id: int | None = None) -> dict:
    """Recursively create units from the hierarchy definition.

    Returns a mapping of unit name -> unit id for use by other seed scripts.
    """
    unit_map = {}

    for name, config in tree.items():
        # Check if unit already exists
        result = await db.execute(select(Unit).where(Unit.uic == config.get("uic")))
        existing = result.scalar_one_or_none()

        if existing:
            unit = existing
        else:
            unit = Unit(
                name=name,
                abbreviation=config["abbr"],
                echelon=config["echelon"],
                parent_id=parent_id,
                uic=config.get("uic"),
            )
            db.add(unit)
            await db.flush()

        unit_map[name] = unit.id
        unit_map[config["abbr"]] = unit.id

        # Recurse into children
        children = config.get("children", {})
        if children:
            child_map = await create_unit_tree(db, children, unit.id)
            unit_map.update(child_map)

    return unit_map


async def seed_units():
    """Main entry point for seeding units."""
    async with async_session() as db:
        unit_map = await create_unit_tree(db, UNIT_HIERARCHY)
        await db.commit()
        print(
            f"Seeded {len(unit_map) // 2} units."
        )  # Each unit appears twice (name + abbr)
        return unit_map


if __name__ == "__main__":
    asyncio.run(seed_units())
