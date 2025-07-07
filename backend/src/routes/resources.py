"""
Routes for resources CRUD and more related to resources Model
"""

from typing import Annotated, Optional, List, Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped

from src.configs.database import get_db
from src.models.address import Address
from src.models.emergency import Emergency
from src.models.emergencyresourceslink import EmergencyResourceLink
from src.models.location import Location
from src.models.resource import Resource, ResourceStatusEnum, ResourceTypeEnum

from src.services.helpers import convertStringToUUID
import uuid as uuid_pkg

router = APIRouter()


class ResourceModel(BaseModel):
    """Base Model For Input/Http Request Validation"""

    name: Optional[str] = Field(None, max_length=128)
    resource_type: Optional[ResourceTypeEnum] = ResourceTypeEnum.UNKNOWN

    actual_address_longitude: Optional[float] = Field(None, ge=-180, le=180)
    actual_address_latitude: Optional[float] = Field(None, ge=-90, le=90)
    actual_longitude: Optional[float] = Field(None, ge=-180, le=180)
    actual_latitude: Optional[float] = Field(None, ge=-90, le=90)

    normal_address_longitude: Optional[float] = Field(None, ge=-180, le=180)
    normal_address_latitude: Optional[float] = Field(None, ge=-90, le=90)
    normal_longitude: Optional[float] = Field(None, ge=-180, le=180)
    normal_latitude: Optional[float] = Field(None, ge=-90, le=90)

    status: Optional[ResourceStatusEnum] = ResourceStatusEnum.UNKNOWN
    responsible: Optional[str] = Field(None, max_length=128)
    telephone: Optional[str] = Field(None, max_length=128)
    email: Optional[str] = Field(None, max_length=128)
    

class ResourcesWithLocationModel(ResourceModel):
    """Base Model For Output/Http Response Validation"""
    id: uuid_pkg.UUID
    location_resource_data: Optional[Location]

    model_config = {
        "arbitrary_types_allowed": True
    }


# LIST ALL RESOURCES
# @router.get("/api/devices", response_model=List[Resource], tags=["Devices"])
@router.get("/api/resources", tags=["Resources"], response_model=List[ResourcesWithLocationModel])
async def list_devices(session: Annotated[AsyncSession, Depends(get_db)])->List[ResourcesWithLocationModel]:
    """List all devices"""
    
    resources = await session.execute(
        select(Resource, Location).join(
            Location, Location.id == Resource.actual_location
        )
    )
    result = resources.all()
    new_resources = []

    for resource, location in result:
        resourceWithLocation = ResourcesWithLocationModel(
            **resource.model_dump(),
            location_resource_data=location
        )
        new_resources.append(resourceWithLocation)

    return new_resources    




#@router.post("/api/devices", response_model=Resource, status_code=201, tags=["Devices"])
@router.post("/api/resources", status_code=201, tags=["Resources"])
async def create_device(
    db: Annotated[AsyncSession, Depends(get_db)],
    request: ResourceModel,
)-> dict[str, str | uuid_pkg.UUID ]:
    """Create a new device/resource"""
    async with db.begin():  # Ensures rollback on failure
        actual_location = Location(
            latitude=request.actual_latitude,
            longitude=request.actual_longitude,
        )
        db.add(actual_location)
        # await db.flush()  # Get user.id before committing

        # For future implementations
        actual_address = Address(
            latitude=request.actual_address_latitude,
            longitude=request.actual_address_longitude,
        )
        db.add(actual_address)
        # await db.flush()  # Get product.id before committing

        normal_location = Location(
            latitude=request.normal_latitude,
            longitude=request.normal_longitude,
        )
        db.add(normal_location)
        # await db.flush()  # Get user.id before committing

        # For future implementations
        normal_address = Address(
            latitude=request.normal_address_latitude,
            longitude=request.normal_address_longitude,
        )
        db.add(normal_address)
        # await db.flush()  # Get product.id before committing

        resource = Resource(
            name=request.name,
            resource_type=request.resource_type,
            actual_address=actual_address.id,
            actual_location=actual_location.id,
            normal_address=normal_address.id,
            normal_location=normal_location.id,
            status=request.status,
            responsible=request.responsible,
            telephone=request.telephone,
            email=request.email,
        )
        db.add(resource)
        
        resource_id = resource.id

    await db.commit()

    return {"message": "Resource Created", "resouce_id:": resource_id}
    


# READ A RESOURCE
@router.get(
    "/api/resources/{resource_id}", response_model=Resource, tags=["Resources"]
)
async def get_device(
    db: Annotated[AsyncSession, Depends(get_db)], resource_id: str
)->Resource:
    """Get device/resource details"""

    resource_uuid = convertStringToUUID(resource_id)

    stmt = select(Resource).where(Resource.id == resource_uuid)
    result = await db.execute(stmt)
    resource = result.scalar_one_or_none()
    if resource is None:
        raise HTTPException(status_code=404, detail="Example not found")
    return resource




# @router.patch("/api/devices/{resource_id}", response_model=Resource, tags=["Devices"])
@router.patch("/api/resources/{resource_id}", tags=["Resources"])
async def update_device(
    db: Annotated[AsyncSession, Depends(get_db)],
    resource_id: str,
    request: ResourceModel,
)-> dict[str, str | uuid_pkg.UUID ]:
    """Update resource details"""

    # Find Resource
    stmt = select(Resource).where(Resource.id == resource_id)
    result = await db.execute(stmt)
    resource = result.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Update Model Data
    model_data = {
        key: value
        for key, value in request.dict().items()
        if key
        in ["resource_type", "status", "responsible", "telephone", "email"]
    }
    # for field, value in model_data.dict(exclude_unset=True).items():
    for field, value in model_data.items():
        setattr(resource, field, value)
    await db.commit()

    # Update Actual Location
    # Find Location
    stmt = select(Location).where(Location.id == resource.actual_location)
    result = await db.execute(stmt)
    actual_location = result.scalars().first()
    if not actual_location:
        raise HTTPException(
            status_code=404, detail="Actual Location not found"
        )
    actual_location.longitude = request.actual_longitude
    actual_location.latitude = request.actual_latitude
    await db.commit()
    # Update Actual Address
    stmt = select(Address).where(Address.id == resource.actual_address)
    result = await db.execute(stmt)
    actual_address = result.scalars().first()
    if not actual_address:
        raise HTTPException(
            status_code=404, detail="Actual Location not found"
        )
    actual_address.longitude = request.actual_address_longitude
    actual_address.latitude = request.actual_address_latitude
    await db.commit()

    # Update Normal Location
    # Find Location
    stmt = select(Location).where(Location.id == resource.normal_location)
    result = await db.execute(stmt)
    normal_location = result.scalars().first()
    if not normal_location:
        raise HTTPException(
            status_code=404, detail="normal Location not found"
        )
    normal_location.longitude = request.normal_longitude
    normal_location.latitude = request.normal_latitude
    await db.commit()
    # Update normal Address
    stmt = select(Address).where(Address.id == resource.normal_address)
    result = await db.execute(stmt)
    normal_address = result.scalars().first()
    if not normal_address:
        raise HTTPException(
            status_code=404, detail="normal Location not found"
        )
    normal_address.longitude = request.normal_address_longitude
    normal_address.latitude = request.normal_address_latitude
    await db.commit()



    return {"message": "Resource Updated", "resouce_id:": resource_id}


# DELETE A RESOURCE
@router.delete("/api/resources/{resource_id}", status_code=200, tags=["Resources"])
async def delete_device(
    db: Annotated[AsyncSession, Depends(get_db)], resource_id: str
):
    """Delete a resource"""

    resource_uuid = convertStringToUUID(resource_id)

    # Fetch Resource From DB From ID
    stmt = select(Resource).where(Resource.id == resource_uuid)
    result = await db.execute(stmt)
    resource = result.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Delete all instances of value in many to many table:
    # Remove relationships in the association table (example_other_model_association)
    stmt = select(EmergencyResourceLink).where(
        EmergencyResourceLink.resource_id == resource.id
    )
    result = await db.execute(stmt)
    resources_to_emergencies = result.scalars().all()
    for el in resources_to_emergencies:
        await db.delete(el)
        await db.commit()

    # Unset ALL Emergencies with This Resource
    result = await db.execute(
        select(Emergency).filter(Emergency.resource_id == resource.id)
    )
    models = result.scalars().all()

    # Unset (set to None) the ex2_id field for those models
    for model in models:
        model.resource_id = None  # Set ex2_id to None
        await db.commit()

    # Unset ALL Emergencies with This Resource
    result_dest = await db.execute(
        select(Emergency).filter(Emergency.destination_id == resource.id)
    )
    models_dest = result_dest.scalars().all()

    # Unset (set to None) the ex2_id field for those models
    for model in models_dest:
        model.destination_id = None  # Set ex2_id to None
        await db.commit()

    # If QOSOD is Active Deactivate it ToDo - IMPORTANT

    # Delete Resource
    await db.delete(resource)
    await db.commit()

    return {"message": "Resource Deleted"}
