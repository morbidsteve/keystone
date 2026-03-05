"""Seed billet structure for a battalion T/O (~20 billets).

Idempotent — checks billet_id_code uniqueness before inserting.
"""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import BilletStructure
from app.models.unit import Unit

logger = logging.getLogger(__name__)


# Battalion-level T/O billet definitions
_BILLETS: list[dict] = [
    # Battalion Staff
    {
        "billet_id_code": "BN-CMD-001",
        "billet_title": "Battalion Commander",
        "mos_required": "0302",
        "rank_required": "LtCol",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BN-XO-001",
        "billet_title": "Battalion Executive Officer",
        "mos_required": "0302",
        "rank_required": "Maj",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BN-SGTMAJ-001",
        "billet_title": "Battalion Sergeant Major",
        "mos_required": "0369",
        "rank_required": "SgtMaj",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BN-S1-001",
        "billet_title": "S-1 Officer",
        "mos_required": "0180",
        "rank_required": "Capt",
        "is_key_billet": False,
    },
    {
        "billet_id_code": "BN-S3-001",
        "billet_title": "S-3 Operations Officer",
        "mos_required": "0302",
        "rank_required": "Maj",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BN-S4-001",
        "billet_title": "S-4 Logistics Officer",
        "mos_required": "0402",
        "rank_required": "Capt",
        "is_key_billet": True,
    },
    # Alpha Company
    {
        "billet_id_code": "ACO-CMD-001",
        "billet_title": "Alpha Company Commander",
        "mos_required": "0302",
        "rank_required": "Capt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "ACO-1SG-001",
        "billet_title": "Alpha Company First Sergeant",
        "mos_required": "0369",
        "rank_required": "1stSgt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "ACO-PLT1-001",
        "billet_title": "1st Platoon Commander",
        "mos_required": "0302",
        "rank_required": "1stLt",
        "is_key_billet": False,
    },
    {
        "billet_id_code": "ACO-PLT1-002",
        "billet_title": "1st Platoon Sergeant",
        "mos_required": "0369",
        "rank_required": "SSgt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "ACO-SQD1-001",
        "billet_title": "1st Squad Leader",
        "mos_required": "0311",
        "rank_required": "Sgt",
        "is_key_billet": False,
    },
    {
        "billet_id_code": "ACO-SQD2-001",
        "billet_title": "2nd Squad Leader",
        "mos_required": "0311",
        "rank_required": "Sgt",
        "is_key_billet": False,
    },
    {
        "billet_id_code": "ACO-SQD3-001",
        "billet_title": "3rd Squad Leader",
        "mos_required": "0311",
        "rank_required": "Sgt",
        "is_key_billet": False,
    },
    # Bravo Company
    {
        "billet_id_code": "BCO-CMD-001",
        "billet_title": "Bravo Company Commander",
        "mos_required": "0302",
        "rank_required": "Capt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BCO-1SG-001",
        "billet_title": "Bravo Company First Sergeant",
        "mos_required": "0369",
        "rank_required": "1stSgt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "BCO-PLT1-001",
        "billet_title": "1st Platoon Commander (B Co)",
        "mos_required": "0302",
        "rank_required": "1stLt",
        "is_key_billet": False,
    },
    # Weapons Company
    {
        "billet_id_code": "WPN-CMD-001",
        "billet_title": "Weapons Company Commander",
        "mos_required": "0302",
        "rank_required": "Capt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "WPN-MORT-001",
        "billet_title": "Mortar Section Leader",
        "mos_required": "0341",
        "rank_required": "SSgt",
        "is_key_billet": False,
    },
    # H&S Company
    {
        "billet_id_code": "HS-CMD-001",
        "billet_title": "H&S Company Commander",
        "mos_required": "0302",
        "rank_required": "Capt",
        "is_key_billet": True,
    },
    {
        "billet_id_code": "HS-COMM-001",
        "billet_title": "Communications Chief",
        "mos_required": "0629",
        "rank_required": "GySgt",
        "is_key_billet": False,
    },
]


async def seed_billets(db: AsyncSession) -> int:
    """Seed billet structure. Returns count of items inserted.

    Assigns billets to the first Battalion-echelon unit found.
    Idempotent — checks billet_id_code before inserting each record.
    """
    # Find the first BN-echelon unit
    result = await db.execute(select(Unit).where(Unit.echelon == "BN").limit(1))
    unit = result.scalar_one_or_none()
    if not unit:
        logger.warning("No battalion-echelon unit found for billet seeding.")
        return 0

    inserted = 0
    for billet_data in _BILLETS:
        # Check uniqueness
        existing = await db.execute(
            select(BilletStructure).where(
                BilletStructure.billet_id_code == billet_data["billet_id_code"]
            )
        )
        if existing.scalar_one_or_none():
            continue

        billet = BilletStructure(
            unit_id=unit.id,
            **billet_data,
        )
        db.add(billet)
        inserted += 1

    if inserted:
        await db.flush()

    return inserted
