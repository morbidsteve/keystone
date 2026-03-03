"""Authentication endpoints: login, register, user management."""

import time
from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.core.permissions import require_role
from app.database import get_db
from app.models.user import Role, User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
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

    result = await db.execute(
        select(User).where(User.username == request.username)
    )
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
    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "token": access_token,
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new user (admin only)."""
    # Check for existing username
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    # Check for existing email
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
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
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()
