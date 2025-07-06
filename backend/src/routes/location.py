"""
Location Routes
"""

from typing import Annotated

from fastapi import (  # type: ignore No warning about pydantic. Imported in requirements.txt
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.configs.database import get_db
from src.models.location import Location
from src.models.resource import Resource

from src.services.helpers import convertStringToUUID

router = APIRouter()

@router.get(
    "/api/devices/{resource_id}/location",
    response_model=Location,
    tags=["Location"],
)
async def get_device_location(
    resource_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get the location for an specific location uuid
    """

    resource_uuid = convertStringToUUID(resource_id)

    stmt = select(Resource).where(Resource.id == resource_uuid)
    result = await db.execute(stmt)
    resource = result.scalar_one_or_none()

    stmt = select(Location).where(Location.id == resource.actual_location)
    result = await db.execute(stmt)
    location = result.scalar_one_or_none()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location
