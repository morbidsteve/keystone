"""Role-based, unit-based, and granular permission-based access control."""

from typing import Callable, List, Set

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db
from app.models.unit import Unit
from app.models.user import Role, User

# ---------------------------------------------------------------------------
# Granular permission definitions
# ---------------------------------------------------------------------------

ALL_PERMISSIONS = [
    "dashboard:view",
    "map:view",
    "map:edit",
    "supply:view",
    "supply:create",
    "supply:edit",
    "supply:delete",
    "equipment:view",
    "equipment:create",
    "equipment:edit",
    "equipment:delete",
    "maintenance:view",
    "maintenance:create",
    "maintenance:edit",
    "maintenance:delete",
    "requisitions:view",
    "requisitions:create",
    "requisitions:edit",
    "requisitions:approve",
    "personnel:view",
    "personnel:create",
    "personnel:edit",
    "personnel:delete",
    "readiness:view",
    "readiness:create",
    "readiness:edit",
    "medical:view",
    "medical:create",
    "medical:edit",
    "medical:delete",
    "transportation:view",
    "transportation:create",
    "transportation:edit",
    "transportation:delete",
    "fuel:view",
    "fuel:create",
    "fuel:edit",
    "fuel:delete",
    "custody:view",
    "custody:create",
    "custody:edit",
    "custody:delete",
    "audit:view",
    "ingestion:view",
    "ingestion:upload",
    "data_sources:view",
    "data_sources:manage",
    "reports:view",
    "reports:create",
    "reports:edit",
    "reports:delete",
    "alerts:view",
    "alerts:create",
    "alerts:manage",
    "admin:users",
    "admin:units",
    "admin:settings",
    "admin:roles",
    "docs:view",
    "simulator:manage",
]

DEFAULT_ROLE_PERMISSIONS: dict[str, Set[str]] = {
    "admin": set(ALL_PERMISSIONS),
    "commander": set(ALL_PERMISSIONS)
    - {
        "admin:users",
        "admin:settings",
        "admin:roles",
        "data_sources:manage",
        "simulator:manage",
    },
    "s4": {
        "dashboard:view",
        "map:view",
        "map:edit",
        "supply:view",
        "supply:create",
        "supply:edit",
        "supply:delete",
        "equipment:view",
        "equipment:create",
        "equipment:edit",
        "equipment:delete",
        "maintenance:view",
        "maintenance:create",
        "maintenance:edit",
        "maintenance:delete",
        "requisitions:view",
        "requisitions:create",
        "requisitions:edit",
        "requisitions:approve",
        "readiness:view",
        "readiness:create",
        "readiness:edit",
        "fuel:view",
        "fuel:create",
        "fuel:edit",
        "fuel:delete",
        "custody:view",
        "custody:create",
        "custody:edit",
        "custody:delete",
        "reports:view",
        "reports:create",
        "reports:edit",
        "reports:delete",
        "alerts:view",
        "alerts:create",
        "transportation:view",
        "transportation:create",
        "transportation:edit",
        "personnel:view",
        "docs:view",
    },
    "s3": {
        "dashboard:view",
        "map:view",
        "map:edit",
        "personnel:view",
        "personnel:create",
        "personnel:edit",
        "personnel:delete",
        "medical:view",
        "medical:create",
        "medical:edit",
        "medical:delete",
        "transportation:view",
        "transportation:create",
        "transportation:edit",
        "transportation:delete",
        "readiness:view",
        "readiness:create",
        "readiness:edit",
        "alerts:view",
        "alerts:create",
        "reports:view",
        "reports:create",
        "requisitions:view",
        "supply:view",
        "equipment:view",
        "ingestion:view",
        "ingestion:upload",
        "docs:view",
    },
    "operator": {
        "dashboard:view",
        "map:view",
        "supply:view",
        "equipment:view",
        "requisitions:view",
        "requisitions:create",
        "requisitions:edit",
        "readiness:view",
        "alerts:view",
        "personnel:view",
        "medical:view",
        "transportation:view",
        "maintenance:view",
        "fuel:view",
        "docs:view",
    },
    "viewer": {
        "dashboard:view",
        "map:view",
        "supply:view",
        "equipment:view",
        "readiness:view",
        "alerts:view",
        "reports:view",
        "personnel:view",
        "docs:view",
    },
}

# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------


async def get_user_permissions(db: AsyncSession, user: User) -> Set[str]:
    """Return the effective set of permission codes for *user*.

    Resolution order:
    1. If the user has a ``custom_role_id`` assigned, query the
       ``role_permissions`` junction table and return those codes.
    2. Otherwise fall back to the ``DEFAULT_ROLE_PERMISSIONS`` mapping
       keyed by the legacy ``Role`` enum value.
    3. ADMINs always receive **all** permissions regardless of custom role.
    """
    # Admins always get everything
    if user.role == Role.ADMIN:
        return set(ALL_PERMISSIONS)

    # Custom role takes precedence when set
    if user.custom_role_id is not None:
        from app.models.rbac import Permission, role_permissions

        stmt = (
            select(Permission.code)
            .join(
                role_permissions,
                Permission.id == role_permissions.c.permission_id,
            )
            .where(role_permissions.c.role_id == user.custom_role_id)
        )
        result = await db.execute(stmt)
        return {row[0] for row in result.all()}

    # Legacy role fallback
    role_key = user.role.value if user.role else "viewer"
    return set(DEFAULT_ROLE_PERMISSIONS.get(role_key, set()))


# ---------------------------------------------------------------------------
# FastAPI dependency factories
# ---------------------------------------------------------------------------


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


def require_permission(permission_code: str) -> Callable:
    """Dependency factory that restricts access based on granular permissions.

    Usage::

        @router.post("/", dependencies=[Depends(require_permission("supply:create"))])
        async def create_supply(...): ...

    Or as a parameter dependency that also returns the current user::

        async def create_supply(
            current_user: User = Depends(require_permission("supply:create")),
        ): ...
    """

    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        perms = await get_user_permissions(db, current_user)
        if permission_code not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission_code}",
            )
        return current_user

    return permission_checker


# ---------------------------------------------------------------------------
# Unit-scoped access helpers (unchanged)
# ---------------------------------------------------------------------------


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
