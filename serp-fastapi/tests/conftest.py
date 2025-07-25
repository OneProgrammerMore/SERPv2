"""
Configuration file for testing SERP fastAPI service
"""


import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from main import app
from src.configs.database import get_db
from src.models import metadata


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Creates the database session to use in tests.
    """
    # Create an in-memory SQLite database
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create tables without starting a transaction
    async with engine.connect() as conn:
        await conn.run_sync(metadata.create_all)
        await conn.commit()

    # Create session factory
    session_maker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Yield a new session for the test, with rollback for isolation
    async with session_maker() as session:
        try:
            yield session
            # Roll back any changes to ensure a clean state for the next test
            await session.rollback()
        finally:
            await session.close()

    # Cleanup: Dispose of the engine after the test
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """
    Function to access the client of the database session for tests.
    """
    # Override the get_db dependency to use the test session
    async def override_get_db():
        try:
            yield db_session
            # Ensure no transaction is left open after each request
            if db_session.in_transaction():
                await db_session.rollback()
        finally:
            pass  # Session is closed in the db_session fixture

    app.dependency_overrides[get_db] = override_get_db

    # Create an AsyncClient for testing
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # Clear dependency overrides after the test
    app.dependency_overrides.clear()
