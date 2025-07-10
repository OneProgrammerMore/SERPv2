"""Resources Model for Database - PostgreSQL"""

import enum
import uuid as uuid_pkg
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum, String, func
from sqlmodel import Field, Relationship, SQLModel

from src.models.emergency import Emergency
from src.models.emergencyresourceslink import EmergencyResourceLink


class ResourceStatusEnum(str, enum.Enum):
    """Resource Status Possibilities"""

    UNKNOWN = "Unknown"
    AVAILABLE = "Available"
    BUSY = "Busy"
    MAINTENANCE = "Maintenance"


class ResourceTypeEnum(str, enum.Enum):
    """Resource Types Possibilities"""

    UNKNOWN = "Unknown"
    AMBULANCE = "Ambulance"
    POLICE = "Police"
    FIRETRUCK = "Firetruck"


class Resource(SQLModel, table=True):
    """Resource Model for SQL Model"""

    id: uuid_pkg.UUID = Field(
        default_factory=uuid_pkg.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    name: Optional[str] = Field(sa_column=Column(String(128), nullable=False))
    resource_type: Optional[ResourceTypeEnum] = Field(
        sa_column=Column(
            Enum(ResourceTypeEnum), default=ResourceTypeEnum.UNKNOWN
        )
    )

    actual_address: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="address.id", ondelete="SET NULL"
    )
    actual_location: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="location.id", ondelete="SET NULL"
    )

    normal_address: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="address.id", ondelete="SET NULL"
    )
    normal_location: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="location.id", ondelete="SET NULL"
    )

    status: Optional[ResourceStatusEnum] = Field(
        sa_column=Column(
            Enum(ResourceStatusEnum), default=ResourceStatusEnum.UNKNOWN
        )
    )
    responsible: Optional[str] = Field(
        sa_column=Column(String(128), nullable=True)
    )
    telephone: Optional[str] = Field(
        sa_column=Column(String(128), nullable=True)
    )
    email: Optional[str] = Field(sa_column=Column(String(128), nullable=True))

    time_created: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    time_updated: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )

    emergencies: List["Emergency"] = Relationship(
        back_populates="resources",
        link_model=EmergencyResourceLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
