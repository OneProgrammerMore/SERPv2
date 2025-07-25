"""Class file to manage Database communitcation"""

import contextlib
from typing import Any, AsyncIterator, Optional

from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from sqlmodel import SQLModel

from src.configs.config import settings

# Define a context variable to store the current task
# current_task = ContextVar("current_task")

POSTGRES_PASSWORD = settings.POSTGRES_PASSWORD
POSTGRES_USER = settings.POSTGRES_USER
POSTGRES_DB = settings.POSTGRES_DB
POSTGRES_HOST = settings.POSTGRES_HOST
POSTGRES_PORT = settings.POSTGRES_PORT
DATABASE_URL = (
    "postgresql+asyncpg://"
    + (str(POSTGRES_USER) if POSTGRES_USER is not None else "")
    + ":"
    + (str(POSTGRES_PASSWORD) if POSTGRES_PASSWORD is not None else "")
    + "@"
    + (str(POSTGRES_HOST) if POSTGRES_HOST is not None else "")
    + ":"
    + (str(POSTGRES_PORT) if POSTGRES_PORT is not None else "")
    + "/"
    + (str(POSTGRES_DB) if POSTGRES_DB is not None else "")
)


Base = declarative_base()

# Heavily inspired by
# https://praciano.com.br/fastapi-and-async-sqlalchemy-20-with-pytest-done-right.html


class DatabaseSessionManager:
    """Class to manage Database session"""

    def __init__(self, host: str, engine_kwargs: dict[str, Any] = {}):
        self._engine: Optional[AsyncEngine] = create_async_engine(
            host, **engine_kwargs
        )
        # self._sessionmaker: Optional[async_sessionmaker[AsyncSession]] = async_sessionmaker(
        #     autocommit=False, bind=self._engine
        # )
        self._sessionmaker: async_sessionmaker = async_sessionmaker(
            autocommit=False, bind=self._engine
        )

    async def close(self) -> None:
        """Close connection with database"""
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")
        await self._engine.dispose()

        self._engine = None
        self._sessionmaker = None

    @contextlib.asynccontextmanager
    async def connect(self) -> AsyncIterator[AsyncConnection]:
        """Connect with database"""
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")

        async with self._engine.begin() as connection:
            try:
                yield connection
            except Exception:
                await connection.rollback()
                raise

    @contextlib.asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """Open a session with the database"""
        if self._sessionmaker is None:
            raise Exception("DatabaseSessionManager is not initialized")

        session = self._sessionmaker()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def create_db_and_tables(self) -> None:
        """Create DB and tables = Migrations"""
        if type(self._engine) == AsyncEngine:
            async with self._engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)

    async def drop_db_and_tables(self) -> None:
        """Drop DB and tables = Migrations"""
        if type(self._engine) == AsyncEngine:
            async with self._engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.drop_all)


sessionmanager = DatabaseSessionManager(DATABASE_URL, {"echo": True})


# Possible Error
async def get_db() -> AsyncSession:
    """Get DB Session"""
    async with sessionmanager.session() as session:
        yield session
