"""JWT token management, password hashing, and SSO authentication utilities."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import Role, User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a plaintext password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency that extracts and validates the current user from JWT."""
    payload = decode_access_token(credentials.credentials)
    username: Optional[str] = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


# ---------------------------------------------------------------------------
# SSO authentication via OAuth2 Proxy headers
# ---------------------------------------------------------------------------

# Map Keycloak group names to Keystone roles
SSO_GROUP_ROLE_MAP: dict[str, Role] = {
    "sre-admins": Role.ADMIN,
    "logistics": Role.S4,
    "operations": Role.S3,
    "command": Role.COMMANDER,
    "armorer": Role.ARMORER,
    "viewer": Role.VIEWER,
}


def _map_groups_to_role(groups_header: str) -> Role:
    """Map a comma-separated Keycloak groups string to the best Keystone role.

    Priority order: ADMIN > COMMANDER > S4 > S3 > ARMORER > OPERATOR (default).
    """
    groups = [g.strip().lower() for g in groups_header.split(",") if g.strip()]

    # Check in priority order
    priority = [
        ("sre-admins", Role.ADMIN),
        ("command", Role.COMMANDER),
        ("logistics", Role.S4),
        ("operations", Role.S3),
        ("armorer", Role.ARMORER),
        ("viewer", Role.VIEWER),
    ]
    for group_name, role in priority:
        if group_name in groups:
            return role

    return Role.OPERATOR


async def authenticate_sso(
    request: Request,
    db: AsyncSession,
) -> Optional[dict]:
    """Authenticate a user via OAuth2 Proxy SSO headers.

    Reads x-auth-request-* headers set by OAuth2 Proxy after Keycloak login.
    Finds or creates the user in the local database.

    Returns a dict with 'token' and 'user' keys (same shape as /login), or
    None if SSO headers are not present.
    """
    raw_user = request.headers.get("x-auth-request-user")
    if not raw_user:
        return None

    email = request.headers.get("x-auth-request-email", f"{raw_user}@sso.local")
    groups = request.headers.get("x-auth-request-groups", "")
    # Prefer the human-readable username over the Keycloak UUID
    username = request.headers.get(
        "x-auth-request-preferred-username", ""
    ) or email.split("@")[0] or raw_user
    display_name = username

    role = _map_groups_to_role(groups)

    # Find existing user by username OR email (handles pre-existing accounts)
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user is None:
        # Auto-provision SSO user
        logger.info("SSO: creating new user %s (role=%s)", username, role.value)
        user = User(
            username=username,
            email=email,
            hashed_password="!sso-managed",  # Cannot be used for local login
            full_name=display_name,
            role=role,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        # Update role and email from SSO on each login
        changed = False
        if user.role != role:
            user.role = role
            changed = True
        if user.email != email:
            user.email = email
            changed = True
        if user.full_name != display_name:
            user.full_name = display_name
            changed = True
        if changed:
            await db.flush()
            await db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    token = create_access_token(data={"sub": user.username})
    return {"token": token, "user": user}
