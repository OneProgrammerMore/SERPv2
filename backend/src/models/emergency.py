"""Define Emergency Model for SERP"""
import enum
import uuid as uuid_pkg
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum, String, func
from sqlmodel import Field, Relationship, SQLModel

from src.models.emergencyresourceslink import EmergencyResourceLink

class EmergencyType(str, enum.Enum):
    """EmergencyType Enum - Type of Emergency"""
    FIRE = "Fire"
    MEDICAL = "Medical"
    ACCIDENT = "Accident"
    NATURAL_DISASTER = "Natural Disaster"
    OTHER = "Other"


class PriorityType(str, enum.Enum):
    """Priority of the emergency"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class StatusType(str, enum.Enum):
    """Status of the emergency"""
    ACTIVE = "Active"
    PENDING = "Pending"
    SOLVED = "Solved"
    ARCHIVED = "Archived"


class Emergency(SQLModel, table=True):
    """Emergency SQLModel for FastApi"""

    id: uuid_pkg.UUID = Field(
        default_factory=uuid_pkg.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )

    name: str = Field(sa_column=Column(String(64), nullable=False))
    description: str = Field(sa_column=Column(String(512), nullable=False))
    priority: PriorityType = Field(
        sa_column=Column(Enum(PriorityType), default=PriorityType.MEDIUM)
    )

    emergency_type: EmergencyType = Field(
        sa_column=Column(Enum(EmergencyType), default=EmergencyType.OTHER)
    )
    status: StatusType = Field(
        sa_column=Column(Enum(StatusType), default=StatusType.ACTIVE)
    )

    location_emergency: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="location.id", ondelete="SET NULL"
    )
    address_emergency: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="address.id", ondelete="SET NULL"
    )

    resource_id: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="resource.id", ondelete="SET NULL"
    )
    
    location_resource: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="location.id", ondelete="SET NULL"
    )
    address_resource: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="address.id", ondelete="SET NULL"
    )

    destination_id: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="resource.id", ondelete="SET NULL"
    )
    location_destination: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="location.id", ondelete="SET NULL"
    )
    address_destination: Optional[uuid_pkg.UUID] = Field(
        default=None, foreign_key="address.id", ondelete="SET NULL"
    )

    name_contact: str = Field(sa_column=Column(String(128)))
    telephone_contact: str = Field(sa_column=Column(String(128)))
    id_contact: str = Field(sa_column=Column(String(128)))

    time_created: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    time_updated: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )

    resources: List["Resource"] = Relationship(
        back_populates="emergencies",
        link_model=EmergencyResourceLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
