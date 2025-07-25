"""File for the many to many table from Emergency and Resources"""

import uuid as uuid_pkg

from sqlmodel import Field, SQLModel


class EmergencyResourceLink(SQLModel, table=True):
    """Many To Many Table for Emergencies to Resources
    ToDo - Change To One to Many table
    """

    emergency_id: uuid_pkg.UUID | None = Field(
        default=None, foreign_key="emergency.id", primary_key=True
    )
    resource_id: uuid_pkg.UUID | None = Field(
        default=None, foreign_key="resource.id", primary_key=True
    )
