"""SQLModel for Addresses"""

import uuid as uuid_pkg
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, String, func
from sqlmodel import Field, SQLModel


class Address(SQLModel, table=True):
    """Address SQLModel for FastAPI"""

    id: uuid_pkg.UUID = Field(
        default_factory=uuid_pkg.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )

    street_number: Optional[str] = Field(
        sa_column=Column(String(16), nullable=True)
    )
    street_name: Optional[str] = Field(
        sa_column=Column(String(64), nullable=True)
    )
    neighborhood: Optional[str] = Field(
        sa_column=Column(String(64), nullable=True)
    )
    city: Optional[str] = Field(sa_column=Column(String(64), nullable=True))
    state: Optional[str] = Field(sa_column=Column(String(64), nullable=True))
    postal_code: Optional[str] = Field(
        sa_column=Column(String(64), nullable=True)
    )
    country: Optional[str] = Field(sa_column=Column(String(64), nullable=True))
    country_code: Optional[str] = Field(
        sa_column=Column(String(64), nullable=True)
    )
    latitude: Optional[float] = Field(sa_column=Column(Float, nullable=True))
    longitude: Optional[float] = Field(sa_column=Column(Float, nullable=True))
    address_line_1: Optional[str] = Field(
        sa_column=Column(String(128), nullable=True)
    )

    time_created: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    time_updated: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )
