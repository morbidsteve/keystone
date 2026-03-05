"""RBAC management endpoints: permissions, custom roles, user role assignment."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import get_user_permissions, require_role
from app.database import get_db
from app.models.rbac import CustomRole, Permission
from app.models.user import Role, User
from app.schemas.rbac import (
    AssignRoleRequest,
    CustomRoleCreate,
    CustomRoleResponse,
    CustomRoleUpdate,
    PermissionResponse,
    UserPermissionsResponse,
)

router = APIRouter()


@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available permissions. Any authenticated user can view."""
    result = await db.execute(
        select(Permission).order_by(Permission.category, Permission.code)
    )
    return result.scalars().all()


@router.get("/roles", response_model=List[CustomRoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """List all custom roles with their permissions. Admin only."""
    result = await db.execute(select(CustomRole).order_by(CustomRole.name))
    return result.scalars().all()


@router.get("/roles/{role_id}", response_model=CustomRoleResponse)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Get a single custom role by ID. Admin only."""
    result = await db.execute(select(CustomRole).where(CustomRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom role {role_id} not found",
        )
    return role


@router.post("/roles", response_model=CustomRoleResponse, status_code=201)
async def create_role(
    data: CustomRoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new custom role. Admin only."""
    # Check for duplicate name
    existing = await db.execute(select(CustomRole).where(CustomRole.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role with name '{data.name}' already exists",
        )

    # Validate permission IDs
    perm_result = await db.execute(
        select(Permission).where(Permission.id.in_(data.permission_ids))
    )
    perms = perm_result.scalars().all()
    if len(perms) != len(data.permission_ids):
        found_ids = {int(p.id) for p in perms}
        missing = set(data.permission_ids) - found_ids
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission IDs: {sorted(missing)}",
        )

    role = CustomRole(
        name=data.name,
        description=data.description,
        is_system=False,
        created_by_user_id=current_user.id,
    )
    role.permissions = list(perms)
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=CustomRoleResponse)
async def update_role(
    role_id: int,
    data: CustomRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update a custom role. Admin only. System roles cannot be modified."""
    result = await db.execute(select(CustomRole).where(CustomRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom role {role_id} not found",
        )

    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System roles cannot be modified",
        )

    if data.name is not None:
        # Check for duplicate name (excluding self)
        dup = await db.execute(
            select(CustomRole).where(
                CustomRole.name == data.name, CustomRole.id != role_id
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role with name '{data.name}' already exists",
            )
        role.name = data.name

    if data.description is not None:
        role.description = data.description

    if data.permission_ids is not None:
        perm_result = await db.execute(
            select(Permission).where(Permission.id.in_(data.permission_ids))
        )
        perms = perm_result.scalars().all()
        if len(perms) != len(data.permission_ids):
            found_ids = {int(p.id) for p in perms}
            missing = set(data.permission_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permission IDs: {sorted(missing)}",
            )
        role.permissions = list(perms)

    await db.flush()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Delete a custom role. Admin only. System roles cannot be deleted."""
    result = await db.execute(select(CustomRole).where(CustomRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom role {role_id} not found",
        )

    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System roles cannot be deleted",
        )

    await db.delete(role)
    await db.flush()
    return None


@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
async def get_user_effective_permissions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get effective permissions for a user. Admin or the user themselves."""
    if current_user.role != Role.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own permissions or must be an admin",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    perms = await get_user_permissions(db, target_user)

    # Determine role name
    if target_user.custom_role_id is not None:
        cr_result = await db.execute(
            select(CustomRole).where(CustomRole.id == target_user.custom_role_id)
        )
        custom_role = cr_result.scalar_one_or_none()
        role_name = custom_role.name if custom_role else target_user.role.value
    else:
        role_name = target_user.role.value

    return UserPermissionsResponse(
        role_name=role_name,
        permissions=sorted(perms),
    )


@router.put("/users/{user_id}/role")
async def assign_role_to_user(
    user_id: int,
    data: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Assign a custom role to a user. Admin only."""
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    # Validate custom role exists
    cr_result = await db.execute(
        select(CustomRole).where(CustomRole.id == data.custom_role_id)
    )
    custom_role = cr_result.scalar_one_or_none()
    if not custom_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom role {data.custom_role_id} not found",
        )

    target_user.custom_role_id = data.custom_role_id
    await db.flush()
    await db.refresh(target_user)

    return {"detail": f"User {user_id} assigned to role '{custom_role.name}'"}
