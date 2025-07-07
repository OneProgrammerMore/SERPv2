"""Database functions for access the session"""


# from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import declarative_base

from src.configs.database import sessionmanager
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncIterator

Base = declarative_base()

# async def get_db() -> AsyncSession:
#     """Dependency function for handling database session per request."""
#     if sessionmanager.session_maker is None:
#         raise Exception("DatabaseSessionManager is not initialized")

#     async with sessionmanager.session_maker() as session:
#         try:
#             # Set schema if needed
#             # await session.execute(text(f"SET search_path TO {SCHEMA}"))

#             yield session  # Provide the session to the request handler
#         except Exception:
#             await session.rollback()
#             raise
#         finally:
#             await session.close()  # Ensure session is closed


# async def get_db() -> AsyncIterator[AsyncSession]:
#     """ Gets the database session"""
#     async with sessionmanager.session() as session:
#         yield session
