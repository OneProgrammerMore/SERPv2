"""User Model for PostgreSQL for SERP Project"""
import uuid as uuid_pkg
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """User SQLModel for FastAPI SERP project"""
    id: uuid_pkg.UUID = Field(
        default_factory=uuid_pkg.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    username: str = Field(
        sa_column=Column(String(21), unique=True, nullable=False)
    )

    time_created: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    time_updated: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )
