"""Role-based and unit-based access control."""

from typing import Callable, List

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.models.unit import Unit
from app.models.user import Role, User


def require_role(roles: List[Role]) -> Callable:
    """Dependency factory that restricts access to specific roles."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' does not have access. "
                f"Required: {[r.value for r in roles]}",
            )
        return current_user

    return role_checker


async def get_accessible_units(db: AsyncSession, user: User) -> List[int]:
    """Return list of unit IDs the user can access (their unit + all subordinates).

    ADMINs and COMMANDERs at MEF level can see everything.
    """
    if user.role == Role.ADMIN:
        result = await db.execute(select(Unit.id))
        return [row[0] for row in result.all()]

    if user.unit_id is None:
        return []

    # Collect subordinate unit IDs via BFS
    accessible: List[int] = []
    queue: List[int] = [int(user.unit_id)]

    while queue:
        current_id = queue.pop(0)
        accessible.append(current_id)
        result = await db.execute(select(Unit.id).where(Unit.parent_id == current_id))
        children = [int(row[0]) for row in result.all()]
        queue.extend(children)

    return accessible


async def check_unit_access(user: User, unit_id: int, db: AsyncSession) -> bool:
    """Verify the user can access data for the given unit."""
    if user.role == Role.ADMIN:
        return True

    accessible = await get_accessible_units(db, user)
    if unit_id not in accessible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this unit's data",
        )
    return True
