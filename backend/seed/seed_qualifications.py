"""Seed sample qualifications for existing personnel records.

Idempotent — checks (personnel_id, qualification_type, qualification_name) before inserting.
"""

import logging
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import Qualification
from app.models.personnel import Personnel

logger = logging.getLogger(__name__)


# Qualification templates to apply to existing personnel
_QUAL_TEMPLATES: list[dict] = [
    {
        "qualification_type": "WEAPONS",
        "qualification_name": "M16/M4 Annual Qualification",
        "days_ago_achieved": 90,
        "days_until_expiry": 275,
    },
    {
        "qualification_type": "FIRST_AID",
        "qualification_name": "Combat Lifesaver",
        "days_ago_achieved": 180,
        "days_until_expiry": 185,
    },
    {
        "qualification_type": "NBC",
        "qualification_name": "CBRN Awareness",
        "days_ago_achieved": 60,
        "days_until_expiry": 305,
    },
    {
        "qualification_type": "DRIVERS",
        "qualification_name": "HMMWV Operator License",
        "days_ago_achieved": 200,
        "days_until_expiry": 165,
    },
    {
        "qualification_type": "SECURITY",
        "qualification_name": "Annual Security Awareness Training",
        "days_ago_achieved": 30,
        "days_until_expiry": 335,
    },
]


async def seed_qualifications(db: AsyncSession) -> int:
    """Seed sample qualifications for the first 10 personnel found.

    Idempotent — checks uniqueness before inserting.
    Returns count of qualifications inserted.
    """
    result = await db.execute(select(Personnel).limit(10))
    personnel_list = result.scalars().all()

    if not personnel_list:
        logger.warning("No personnel found for qualification seeding.")
        return 0

    today = date.today()
    inserted = 0

    for person in personnel_list:
        for template in _QUAL_TEMPLATES:
            # Check uniqueness
            existing = await db.execute(
                select(Qualification).where(
                    Qualification.personnel_id == person.id,
                    Qualification.qualification_type == template["qualification_type"],
                    Qualification.qualification_name == template["qualification_name"],
                )
            )
            if existing.scalar_one_or_none():
                continue

            achieved = today - timedelta(days=template["days_ago_achieved"])
            expiry = today + timedelta(days=template["days_until_expiry"])

            qual = Qualification(
                personnel_id=person.id,
                qualification_type=template["qualification_type"],
                qualification_name=template["qualification_name"],
                date_achieved=achieved,
                expiration_date=expiry,
                is_current=True,
            )
            db.add(qual)
            inserted += 1

    if inserted:
        await db.flush()

    return inserted
