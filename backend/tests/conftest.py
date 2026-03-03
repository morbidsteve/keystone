"""Pytest fixtures for KEYSTONE tests."""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.core.auth import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models.unit import Echelon, Unit
from app.models.user import Role, User


# Use in-memory SQLite for tests, or a test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide a test HTTP client."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_unit(db_session: AsyncSession) -> Unit:
    """Create a test unit."""
    unit = Unit(
        name="Test Battalion",
        abbreviation="TST BN",
        echelon=Echelon.BN,
        uic="T00001",
    )
    db_session.add(unit)
    await db_session.flush()
    await db_session.refresh(unit)
    return unit


@pytest_asyncio.fixture
async def test_unit_child(db_session: AsyncSession, test_unit: Unit) -> Unit:
    """Create a child company under the test battalion."""
    unit = Unit(
        name="Alpha Company Test",
        abbreviation="A Co TST",
        echelon=Echelon.CO,
        parent_id=test_unit.id,
        uic="T00011",
    )
    db_session.add(unit)
    await db_session.flush()
    await db_session.refresh(unit)
    return unit


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, test_unit: Unit) -> User:
    """Create an admin user."""
    user = User(
        username="testadmin",
        email="testadmin@test.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Admin",
        role=Role.ADMIN,
        unit_id=test_unit.id,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def operator_user(db_session: AsyncSession, test_unit: Unit) -> User:
    """Create an operator user."""
    user = User(
        username="testoperator",
        email="testop@test.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Operator",
        role=Role.OPERATOR,
        unit_id=test_unit.id,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def admin_token(admin_user: User) -> str:
    """Generate a JWT token for the admin user."""
    return create_access_token(
        data={"sub": admin_user.username, "role": admin_user.role.value, "unit_id": admin_user.unit_id}
    )


@pytest_asyncio.fixture
def operator_token(operator_user: User) -> str:
    """Generate a JWT token for the operator user."""
    return create_access_token(
        data={"sub": operator_user.username, "role": operator_user.role.value, "unit_id": operator_user.unit_id}
    )
