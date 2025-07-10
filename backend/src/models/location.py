"""Location DB Table for SERP"""

import uuid as uuid_pkg
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, func
from sqlmodel import Field, SQLModel


class Location(SQLModel, table=True):
    """Location SQLModel For FastAPI"""

    id: uuid_pkg.UUID = Field(
        default_factory=uuid_pkg.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    latitude: float = Field(sa_column=Column(Float, nullable=True))
    longitude: float = Field(sa_column=Column(Float, nullable=True))
    accuracy: Optional[float] = Field(sa_column=Column(Float, nullable=True))
    speed: Optional[float] = Field(sa_column=Column(Float, nullable=True))
    heading: Optional[float] = Field(sa_column=Column(Float, nullable=True))

    time_created: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    time_updated: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )
