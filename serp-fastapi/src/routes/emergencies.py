"""Routes for emergencies CRUD and more"""

import uuid as uuid_pkg
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from pydantic import (
    BaseModel,
    Field,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.configs.database import get_db
from src.models.address import Address
from src.models.emergency import (
    Emergency,
    EmergencyType,
    PriorityType,
    StatusType,
)
from src.models.emergencyresourceslink import EmergencyResourceLink
from src.models.location import Location
from src.models.resource import Resource, ResourceStatusEnum

router = APIRouter()


class EmergencyRequest(BaseModel):
    """Model for input/request of create a new emergency endpoint"""

    name: str = Field(..., max_length=64)
    description: str = Field(..., max_length=512)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    emergency_type: EmergencyType
    priority: PriorityType
    status: StatusType
    name_contact: Optional[str] = None
    telephone_contact: Optional[str] = None
    id_contact: Optional[str] = None


class EmergencyModelResponse(BaseModel):
    """
    Model to return as Emergency Model
    """

    id: uuid_pkg.UUID

    name: str
    description: str
    priority: PriorityType

    emergency_type: EmergencyType
    status: StatusType
    location_emergency: Optional[uuid_pkg.UUID]
    address_emergency: Optional[uuid_pkg.UUID]

    resource_id: Optional[uuid_pkg.UUID]
    location_resource: Optional[uuid_pkg.UUID]
    address_resource: Optional[uuid_pkg.UUID]

    destination_id: Optional[uuid_pkg.UUID]

    location_destination: Optional[uuid_pkg.UUID]
    address_destination: Optional[uuid_pkg.UUID]

    name_contact: Optional[str]
    telephone_contact: Optional[str]
    id_contact: Optional[str]

    time_created: datetime
    time_updated: Optional[datetime]


class EmergencyWithResourcesModelResponse(EmergencyModelResponse):
    """
    Struct that defines the response for endpoints with response list of emergencies
    """
    resources: List[uuid_pkg.UUID]

    model_config = {"arbitrary_types_allowed": True, "from_attributes": True}


class EmergencyWithLocationModelResponse(EmergencyModelResponse):
    """
    Struct that defines the response for endpoints with response emergency with location data.
    """
    location_emergency_data: Optional[Location]

    model_config = {"arbitrary_types_allowed": True}


@router.get(
    "/api/emergencies",
    status_code=200,
    response_model=List[EmergencyWithLocationModelResponse],
    tags=["Emergencies"],
)
async def list_alerts(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> List[EmergencyWithLocationModelResponse]:
    """List all emergencies"""

    emergencies = await session.execute(
        select(Emergency, Location).join(
            Location, Location.id == Emergency.location_emergency
        )
    )

    result = emergencies.all()
    emergencies_with_location = []

    for emergency, location in result:
        emergency_with_location = EmergencyWithLocationModelResponse(
            # **emergency.model_dump(),
            **emergency.__dict__,  # Using __dict__ as model_dump can cause problems in async contexts, or so I read online, I do not understand why ^^'
            location_emergency_data=location,
        )
        emergencies_with_location.append(emergency_with_location)

    return emergencies_with_location


class MessageResponse(BaseModel):
    """
    Struct for response of several endpoints
    """
    message: str
    emergency_id: str


@router.post(
    "/api/emergencies",
    response_model=MessageResponse,
    status_code=201,
    tags=["Emergencies"],
)
async def create_alert(
    request: EmergencyRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """
    Create a new emergency
    """
    async with db.begin():  # Ensures rollback on failure
        location = Location(
            latitude=request.latitude, longitude=request.longitude
        )
        db.add(location)
        await db.flush()

        address = Address(
            latitude=request.latitude, longitude=request.longitude
        )
        db.add(address)
        await db.flush()

        emergency = Emergency(
            name=request.name,
            description=request.description,
            emergency_type=request.emergency_type,
            location_emergency=location.id,
            address_emergency=address.id,
            priority=request.priority,
            status=request.status,
            name_contact=request.name_contact,
            telephone_contact=request.telephone_contact,
            id_contact=request.id_contact,
        )
        db.add(emergency)
        emergency_id = emergency.id

    return {"message": "Emergency Created", "emergency_id": str(emergency_id)}


# READ EMERGENCY
@router.get(
    "/api/emergencies/{emergency_id}",
    response_model=EmergencyModelResponse,
    status_code=201,
    tags=["Emergencies"],
)
async def get_alert(
    emergency_id: uuid_pkg.UUID, db: AsyncSession = Depends(get_db)
) -> EmergencyModelResponse:
    """Get emergency details"""
    stmt = select(Emergency).where(Emergency.id == emergency_id)
    result = await db.execute(stmt)
    emergency = result.scalar_one_or_none()
    if emergency is None:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return emergency


@router.patch(
    "/api/emergencies/{emergency_id}",
    response_model=MessageResponse,
    status_code=201,
    tags=["Emergencies"],
)
async def update_alert(
    emergency_id: uuid_pkg.UUID,
    request: EmergencyRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Update an emergency"""

    stmt = select(Emergency).where(Emergency.id == emergency_id)
    result = await db.execute(stmt)
    emergency = result.scalars().first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    # Update Location Emergency
    stmt = select(Location).where(Location.id == emergency.location_emergency)
    result = await db.execute(stmt)
    location = result.scalars().first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    location.latitude = request.latitude
    location.longitude = request.longitude
    db.add(location)

    included_flieds = {
        "name",
        "description",
        "priority",
        "status",
        "emergency_type",
        "name_contact",
        "telephone_contact",
        "id_contact",
    }
    # Update Emergency
    for field, value in request.dict(
        exclude_unset=True, include=included_flieds
    ).items():
        setattr(emergency, field, value)
    db.add(emergency)
    await db.commit()

    await db.refresh(emergency)

    # Si estamos resolviendo la alerta
    if emergency.status == StatusType.SOLVED:
        # Get associated Resources
        statement = (
            select(Resource)
            .join(
                EmergencyResourceLink,
                Resource.id == EmergencyResourceLink.resource_id,
            )
            .where(EmergencyResourceLink.emergency_id == emergency.id)
        )
        results = await db.execute(statement)
        emergencies = results.scalars().all()
        # Deactivate QoS
        for device in emergencies:
            print("To Do - Deactivate QOSOD for Device", device.id)

        response = [{"emergecy_id": str(emergency.id), "message": "Updated"}]

        return response

    return {"message": "Updated", "emergency_id": str(emergency.id)}


class MessageDeleteResponse(BaseModel):
    """
    Struct for response validation for endpoints
    """
    message: str


# DELETE A EMERGENCY
@router.delete(
    "/api/emergencies/{emergency_id}",
    response_model=MessageDeleteResponse,
    status_code=200,
    tags=["Emergencies"],
)
async def delete_device(
    db: Annotated[AsyncSession, Depends(get_db)], emergency_id: str
) -> MessageDeleteResponse:
    """Delete an emergency"""

    try:
        emergency_uuid = uuid_pkg.UUID(emergency_id)  # Convert to UUID type
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="Invalid UUID format"
        ) from exc

    # Fetch Resource From DB From ID
    stmt = select(Emergency).where(Emergency.id == emergency_uuid)
    result = await db.execute(stmt)
    emergency = result.scalars().first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Delete Emergency
    await db.delete(emergency)
    await db.commit()

    return {"message": "Emergency Deleted"}


@router.get(
    "/api/resources/{resource_id}/assignments",
    response_model=List[EmergencyModelResponse],
    status_code=201,
    tags=["Resources"],
)
async def get_device_assignments(
    resource_id: uuid_pkg.UUID, session: AsyncSession = Depends(get_db)
) -> List[EmergencyModelResponse]:
    """Get emergency assigned to a specific resource"""

    stmt = select(Resource).where(Resource.id == resource_id)
    result = await session.execute(stmt)
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    resource = result.unique().scalar_one()

    emergencies_for_resource = []

    for emergency in resource.emergencies:
        emergencies_for_resource.append(
            EmergencyModelResponse(**emergency.__dict__)
        )
    return emergencies_for_resource


class EmergencyAssignResourcesRequest(BaseModel):
    """Input for assing resources to emergency endpoint"""

    resourcesIDs: List[uuid_pkg.UUID]


@router.post(
    "/api/emergencies/{emergency_id}/assign",
    response_model=MessageResponse,
    tags=["Emergencies"],
)
async def add_device_assignments(
    emergency_id: uuid_pkg.UUID,
    request: EmergencyAssignResourcesRequest,
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Assign resources to an emergency."""

    # Fetch the emergency with its resources in one query
    stmt = (
        select(Emergency)
        .options(selectinload(Emergency.resources))
        .where(Emergency.id == emergency_id)
    )
    result = await session.execute(stmt)
    emergency = result.unique().scalar_one_or_none()

    if emergency is None:
        raise HTTPException(status_code=404, detail="Emergency not found")

    # Reset existing resources to AVAILABLE
    for resource in emergency.resources:
        resource.status = ResourceStatusEnum.AVAILABLE
        session.add(resource)

    # Fetch and update new resources
    db_resources = []
    for resource_id in request.resourcesIDs:
        stmt = select(Resource).where(Resource.id == resource_id)
        result = await session.execute(stmt)
        resource = result.scalar_one_or_none()
        if resource is None:
            raise HTTPException(
                status_code=404, detail=f"Resource {resource_id} not found"
            )

        resource.status = ResourceStatusEnum.BUSY
        session.add(resource)
        db_resources.append(resource)

    # Update the many-to-many relationship
    emergency.resources = db_resources

    # Commit all changes in one transaction
    session.add(emergency)
    await session.commit()

    # Refresh the emergency to ensure the response includes updated data
    await session.refresh(emergency, attribute_names=["resources"])

    return {"message": "Updated", "emergency_id": str(emergency_id)}
