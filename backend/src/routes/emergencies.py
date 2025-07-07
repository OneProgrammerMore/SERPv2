"""Routes for emergencies CRUD and more"""

import uuid as uuid_pkg
from typing import Annotated, Optional, List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import ORJSONResponse
from pydantic import (
    BaseModel,
    Field,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped

from src.configs.database import get_db
from src.models.address import Address
from src.models.emergency import (
    Emergency,
    EmergencyType,
    PriorityType,
    StatusType,
)

from datetime import datetime
from sqlalchemy.orm import selectinload

from src.models.emergencyresourceslink import EmergencyResourceLink
from src.models.location import Location
from src.models.resource import Resource, ResourceStatusEnum

from src.services.helpers import convertStringToUUID

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


# UPDATE EMERGENCY
class EmergencyUpdateRequest(BaseModel):
    """Model for request/input data for updating an emergency endpoint"""
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityType] = None
    emergency_type: Optional[EmergencyType] = None
    status: Optional[StatusType] = None

    location_emergency: Optional[uuid_pkg.UUID] = None
    address_emergency: Optional[uuid_pkg.UUID] = None

    resource_id: Optional[uuid_pkg.UUID] = None
    location_resource: Optional[uuid_pkg.UUID] = None
    address_resource: Optional[uuid_pkg.UUID] = None

    destination_id: Optional[uuid_pkg.UUID] = None
    location_destination: Optional[uuid_pkg.UUID] = None
    address_destination: Optional[uuid_pkg.UUID] = None

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
    resources: List[uuid_pkg.UUID]
    #model_config = ConfigDict(from_attributes=True)
    
    model_config = {
        "arbitrary_types_allowed": True,
        "from_attributes": True
    }


class EmergencyWithLocationModelResponse(EmergencyModelResponse):
    location_emergency_data: Optional[Location]
    
    model_config = {
        "arbitrary_types_allowed": True
    }

@router.get("/api/emergencies", response_model=List[EmergencyWithLocationModelResponse] ,tags=["Emergencies"])
async def list_alerts(session: Annotated[AsyncSession, 
    Depends(get_db)]
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
        emergencyWithLocation = EmergencyWithLocationModelResponse(
            **emergency.model_dump(),
            location_emergency_data=location
        )
        emergencies_with_location.append(emergencyWithLocation)

    return emergencies_with_location

class MessageResponse(BaseModel):
    message: str
    emergency_id: str


@router.post(
    "/api/emergencies", response_model=MessageResponse, status_code=201, tags=["Emergencies"]
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

    await db.commit()

    return {"message": "Emergency Created", "emergency_id": str(emergency_id)}


# READ EMERGENCY
@router.get("/api/emergencies/{emergency_id}", response_model=EmergencyModelResponse, tags=["Emergencies"])
async def get_alert(emergency_id: str, db: AsyncSession = Depends(get_db))->EmergencyModelResponse:
    """Get emergency details"""
    stmt = select(Emergency).where(Emergency.id == emergency_id)
    result = await db.execute(stmt)
    emergency = result.scalar_one_or_none()
    if emergency is None:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return emergency



@router.patch(
    "/api/emergencies/{emergency_id}", response_model=MessageResponse, tags=["Emergencies"]
)
async def update_alert(
    emergency_id: str,
    request: EmergencyUpdateRequest,
    db: AsyncSession = Depends(get_db),
)->MessageResponse:
    """Update an emergency"""

    stmt = select(Emergency).where(Emergency.id == emergency_id)
    result = await db.execute(stmt)
    emergency = result.scalars().first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Example not found")

    # Update Emergency
    for field, value in request.dict(exclude_unset=True).items():
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
        # print("DEBUG - Respone", response)
        return response

    # return {"message": "Emergency updated", "emergecy_id": emergency.id}
    return {"message": "Updated", "emergency_id": str(emergency.id)}



class MessageDeleteResponse(BaseModel):
    message: str

# DELETE A EMERGENCY
@router.delete("/api/emergencies/{emergency_id}", response_model=MessageDeleteResponse, status_code=200, tags=["Emergencies"])
async def delete_device(
    db: Annotated[AsyncSession, Depends(get_db)], emergency_id: str
)->MessageDeleteResponse:
    """Delete an emergency"""

    try:
        emergency_uuid = uuid_pkg.UUID(emergency_id)  # Convert to UUID type
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid UUID format") from exc

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

# @router.get("/api/devices/{resource_id}/assignments",
# response_model=List[Emergency], tags=["Alerts"])
@router.get("/api/resources/{resource_id}/assignments",response_model=List[EmergencyModelResponse] , tags=["Resources"])
async def get_device_assignments(
    resource_id: uuid_pkg.UUID, session: AsyncSession = Depends(get_db)
)->List[EmergencyModelResponse]:
    """Get emergency assigned to a specific resource"""

    stmt = select(Resource).where(Resource.id == resource_id)
    result = await session.execute(stmt)
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    resource = result.unique().scalar_one()
    
    # return resource.emergencies
    
    emergencies_for_resource = []

    for emergency in resource.emergencies:
        emergencies_for_resource.append(
            EmergencyModelResponse(
                **emergency.model_dump()
            )
        )
    return emergencies_for_resource
    

class EmergencyAssignResourcesRequest(BaseModel):
    """Input for assing resources to emergency endpoint"""
    resourcesIDs: List[uuid_pkg.UUID]


# # Assign resources to emergency by ID
# @router.post("/api/alerts/{emergency_id}/assign", response_model=EmergencyModelResponse, tags=["Alerts"])
# async def add_device_assignments(
#     emergency_id: uuid_pkg.UUID,
#     request: EmergencyAssignResourcesRequest,
#     session: AsyncSession = Depends(get_db),
# )->EmergencyModelResponse:
#     """Get alerts assigned to a specific device"""

#     # Select Emergency From Database By emergency_id
#     #stmt = select(Emergency).where(Emergency.id == str(emergency_id))
#     stmt = select(Emergency).options(selectinload(Emergency.resources)).where(Emergency.id == emergency_id)
#     result = await session.execute(stmt)
#     await session.flush() 
#     # if not result:
#     #     raise HTTPException(status_code=404, detail="Example not found")
#     emergency = result.unique().scalar_one_or_none()
#     if emergency is None:
#         raise HTTPException(status_code=404, detail="Example not found")

#     # Clean Old Resources Status to Available
#     for resource in emergency.resources:
#         #stmt = select(Resource).where(Resource.id == resource.id)
#         #result = await session.execute(stmt)
#         #resource = result.scalar_one_or_none()
#         #if resource is None:
#         #    raise HTTPException(status_code=404, detail="Resource not found")
        
#         resource.status = ResourceStatusEnum.AVAILABLE
#         session.add(resource)
#     await session.commit()

#     # Select Assigned Resources From Database and add to db_resources var
#     db_resources = []
#     print("request.resourcesIDS - here", request.resourcesIDs)
#     for resource_id in request.resourcesIDs:
#     #for resource_id in request.EmergencyAssignResourcesRequest.resourcesIDs:
#         stmt = select(Resource).where(Resource.id == resource_id)
#         result = await session.execute(stmt)
#         resource = result.scalar_one_or_none()
#         if resource is None:
#             raise HTTPException(status_code=404, detail="Resource not found")
        
#         resource.status = ResourceStatusEnum.BUSY
#         session.add(resource)
#         db_resources.append(resource)
#     # await session.commit()
#     # for resource in db_resources:
#     #     await session.refresh(resource)

#     # await session.flush() 

#     print("db_resources - here2", db_resources)
#     print("db_resources - here2", db_resources)
#     # Add assigned resources to emergency in the many to many table
#     result = await session.exec(
#         select(Emergency).options(selectinload(Emergency.resources)).where(Emergency.id == emergency_id)
#     )
#     emergency = result.one()

#     emergency.resources = db_resources
#     session.add(emergency)
#     await session.commit()
#     # Refresh the emergency model to return
#     await session.refresh(emergency)

#     emergency_response = EmergencyModelResponse(
#         **emergency.model_dump()
#     )
    
#     return emergency_response

@router.post("/api/emergencies/{emergency_id}/assign", response_model=MessageResponse, tags=["Emergencies"])
async def add_device_assignments(
    emergency_id: uuid_pkg.UUID,
    request: EmergencyAssignResourcesRequest,
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Assign resources to an emergency."""

    # Fetch the emergency with its resources in one query
    stmt = select(Emergency).options(selectinload(Emergency.resources)).where(Emergency.id == emergency_id)
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
            raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
        
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

    # Create response model (avoid model_dump() if it causes issues)
    #emergency_response = EmergencyModelResponse.from_orm(emergency)
    # emergency_response = EmergencyWithResourcesModelResponse.from_orm(emergency)
    
    # emergency_response = EmergencyWithResourcesModelResponse(
    #     **emergency.model_dump()
    # )

    #print("emergency_response",emergency_response)

    #return emergency_response
    return {"message": "Updated", "emergency_id": str(emergency_id)}
