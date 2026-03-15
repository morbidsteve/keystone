"""Authentication endpoints: login, register, user management."""

import time
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.core.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.core.permissions import get_user_permissions, require_role
from app.database import get_db
from app.models.user import Role, User
from app.schemas.auth import (
    LoginRequest,
    UserCreate,
    UserResponse,
)

router = APIRouter()

# --- Rate Limiting ---
# In-memory tracker: username -> (failure_count, first_failure_timestamp)
_login_failures: Dict[str, Tuple[int, float]] = {}
_MAX_FAILURES = 5
_LOCKOUT_SECONDS = 15 * 60  # 15 minutes


def _check_rate_limit(username: str) -> None:
    """Check if a username is locked out due to too many failed attempts.

    Raises HTTPException 429 if the account is temporarily locked.
    """
    if username not in _login_failures:
        return

    failures, first_failure_time = _login_failures[username]
    elapsed = time.time() - first_failure_time

    # Reset if lockout window has expired
    if elapsed > _LOCKOUT_SECONDS:
        del _login_failures[username]
        return

    if failures >= _MAX_FAILURES:
        remaining = int(_LOCKOUT_SECONDS - elapsed)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Account temporarily locked due to {_MAX_FAILURES} failed "
                f"login attempts. Try again in {remaining} seconds."
            ),
        )


def _record_failure(username: str) -> None:
    """Record a failed login attempt for rate limiting."""
    if username in _login_failures:
        failures, first_time = _login_failures[username]
        # Reset window if expired
        if time.time() - first_time > _LOCKOUT_SECONDS:
            _login_failures[username] = (1, time.time())
        else:
            _login_failures[username] = (failures + 1, first_time)
    else:
        _login_failures[username] = (1, time.time())


def _clear_failures(username: str) -> None:
    """Clear failure tracking on successful login."""
    _login_failures.pop(username, None)


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT token with user info."""
    # Check rate limit before processing
    _check_rate_limit(request.username)

    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.hashed_password):
        _record_failure(request.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    # Clear rate limit on successful login
    _clear_failures(request.username)

    # Only include 'sub' in JWT payload
    access_token = create_access_token(data={"sub": user.username})

    # Build response with effective permissions
    perms = await get_user_permissions(db, user)
    user_data = UserResponse.model_validate(user).model_dump()
    user_data["permissions"] = sorted(perms)

    return {
        "token": access_token,
        "user": user_data,
    }


@router.get("/sso-user")
async def get_sso_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get or create user from SSO headers (OAuth2 Proxy / Keycloak).

    When AUTH_MODE=sso, the app sits behind an OAuth2 Proxy that sets
    X-Auth-Request-User, X-Auth-Request-Email, and X-Auth-Request-Groups
    headers after authenticating the user via Keycloak.
    """
    if settings.AUTH_MODE != "sso":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SSO not enabled")

    username = request.headers.get("x-auth-request-user", "")
    email = request.headers.get("x-auth-request-email", "")
    groups = request.headers.get("x-auth-request-groups", "")

    if not username and not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No SSO headers found")

    # Use email prefix or username as the identifier
    identifier = username or email.split("@")[0]

    # Find existing user
    result = await db.execute(select(User).where(User.username == identifier))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create user from SSO with a placeholder password hash
        user = User(
            username=identifier,
            full_name=username or email,
            email=email or f"{identifier}@sso.local",
            hashed_password=hash_password("!SSO-managed-account!"),
            role=Role.COMMANDER,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Generate JWT token
    access_token = create_access_token(data={"sub": user.username})

    # Build response matching the login endpoint format
    perms = await get_user_permissions(db, user)
    user_data = UserResponse.model_validate(user).model_dump()
    user_data["permissions"] = sorted(perms)

    return {
        "token": access_token,
        "user": user_data,
    }


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new user (admin only)."""
    # Check for existing username
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    # Check for existing email
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        unit_id=user_data.unit_id,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user with effective permissions."""
    perms = await get_user_permissions(db, current_user)
    user_data = UserResponse.model_validate(current_user).model_dump()
    user_data["permissions"] = sorted(perms)
    return user_data


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


class DemoUserProfile(BaseModel):
    """Public profile for a demo user shown in the role picker."""

    username: str
    full_name: str
    rank: Optional[str] = None
    billet: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    section: Optional[str] = None
    role: str
    mos: Optional[str] = None


@router.post("/demo-users", response_model=List[DemoUserProfile])
async def get_demo_users(
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Return list of demo user profiles for the role picker.

    Only available in development mode. No authentication required.
    """
    if settings.ENV_MODE != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo users are only available in development mode",
        )

    result = await db.execute(
        select(User)
        .options(joinedload(User.unit))
        .where(User.demo_profile.isnot(None))
        .order_by(User.id)
    )
    users = result.unique().scalars().all()

    profiles: List[Dict[str, Any]] = []
    for user in users:
        profile = user.demo_profile or {}
        billet = profile.get("billet", "")

        # Determine section based on billet
        section = "Command"
        billet_lower = billet.lower()
        if "supply" in billet_lower or "s-4" in billet_lower or "s4" in billet_lower:
            section = "Logistics (S-4)"
        elif (
            "s-3" in billet_lower
            or "s3" in billet_lower
            or "operations" in billet_lower
        ):
            section = "Operations (S-3)"
        elif "s-1" in billet_lower or "admin" in billet_lower:
            section = "Administration (S-1)"
        elif "maint" in billet_lower:
            section = "Maintenance"
        elif "motor" in billet_lower or "dispatch" in billet_lower:
            section = "Motor Transport"
        elif "surgeon" in billet_lower or "medical" in billet_lower:
            section = "Medical"
        elif "sergeant major" in billet_lower:
            section = "Command"
        elif "battery commander" in billet_lower:
            section = "Command"

        profiles.append(
            {
                "username": user.username,
                "full_name": user.full_name,
                "rank": profile.get("rank"),
                "billet": billet,
                "unit": user.unit.abbreviation if user.unit else None,
                "description": profile.get("description"),
                "section": section,
                "role": user.role.value,
                "mos": profile.get("mos"),
            }
        )

    return profiles
