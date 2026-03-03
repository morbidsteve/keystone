"""Seed users with various roles for KEYSTONE.

Creates:
  admin/admin123        - ADMIN at I MEF
  commander/cmd123      - COMMANDER at 1st MarDiv
  s4officer/s4pass123   - S4 at 1st Marines
  s3officer/s3pass123   - S3 at 1st Marines
  operator/op123        - OPERATOR at 1/1
  viewer/view123        - VIEWER at Alpha Co 1/1
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password
from app.database import async_session
from app.models.unit import Unit
from app.models.user import Role, User


SEED_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "email": "admin@keystone.usmc.mil",
        "full_name": "System Administrator",
        "role": Role.ADMIN,
        "unit_abbr": "I MEF",
    },
    {
        "username": "commander",
        "password": "cmd123",
        "email": "commander@keystone.usmc.mil",
        "full_name": "COL James Smith",
        "role": Role.COMMANDER,
        "unit_abbr": "1st MarDiv",
    },
    {
        "username": "s4officer",
        "password": "s4pass123",
        "email": "s4@keystone.usmc.mil",
        "full_name": "MAJ Sarah Johnson",
        "role": Role.S4,
        "unit_abbr": "1st Marines",
    },
    {
        "username": "s3officer",
        "password": "s3pass123",
        "email": "s3@keystone.usmc.mil",
        "full_name": "MAJ Robert Davis",
        "role": Role.S3,
        "unit_abbr": "1st Marines",
    },
    {
        "username": "operator",
        "password": "op123",
        "email": "operator@keystone.usmc.mil",
        "full_name": "SSGT Michael Brown",
        "role": Role.OPERATOR,
        "unit_abbr": "1/1",
    },
    {
        "username": "viewer",
        "password": "view123",
        "email": "viewer@keystone.usmc.mil",
        "full_name": "SGT Emily Wilson",
        "role": Role.VIEWER,
        "unit_abbr": "A Co 1/1",
    },
]


async def seed_users_from_session(db: AsyncSession):
    """Create seed users using an existing database session.

    Called from app startup. Idempotent — skips existing users.
    """
    created = 0

    for user_data in SEED_USERS:
        result = await db.execute(
            select(User).where(User.username == user_data["username"])
        )
        if result.scalar_one_or_none():
            continue

        unit_id = None
        result = await db.execute(
            select(Unit).where(Unit.abbreviation == user_data["unit_abbr"])
        )
        unit = result.scalar_one_or_none()
        if unit:
            unit_id = unit.id

        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
            full_name=user_data["full_name"],
            role=user_data["role"],
            unit_id=unit_id,
        )
        db.add(user)
        created += 1

    print(f"Seeded {created} users.")


async def seed_users():
    """Create seed users (standalone entry point).

    WARNING: Seed users have trivial passwords and must ONLY be used
    in development environments.
    """
    env_mode = os.environ.get("ENV_MODE", "development")
    if env_mode != "development":
        print(
            f"ERROR: seed_users refused to run — ENV_MODE={env_mode!r}. "
            "Seed users have trivial passwords and must NOT be created "
            "in non-development environments. Set ENV_MODE=development "
            "to override (dev/test only)."
        )
        return

    print(
        "WARNING: Creating seed users with trivial passwords. "
        "These accounts are for DEVELOPMENT ONLY and must not exist in production."
    )

    async with async_session() as db:
        await seed_users_from_session(db)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_users())
