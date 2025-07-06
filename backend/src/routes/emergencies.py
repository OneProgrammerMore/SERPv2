"""Routes for emergencies CRUD and more"""

import uuid as uuid_pkg
from typing import Annotated, Optional

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

#@router.get("/api/alerts", response_model=List[Emergency], tags=["Alerts"])
@router.get("/api/alerts", tags=["Alerts"])
async def list_alerts(session: Annotated[AsyncSession, Depends(get_db)]):
    """List all emergencies/alerts"""

    emergencies = await session.execute(
        select(Emergency, Location).join(
            Location, Location.id == Emergency.location_emergency
        )
    )
    result = emergencies.all()
    emergencies_with_location = []
    for emergency, location_emergency in result:
        # print("DEBUG LOCATION EMERGENCY", location_emergency)
        emergencies_with_location.append(
            {
                **emergency.model_dump(),
                "location_emergency_data": location_emergency.model_dump(),
            }
        )
    return emergencies_with_location


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


@router.post(
    "/api/alerts", response_model=Emergency, status_code=201, tags=["Alerts"]
)
async def create_alert(
    request: EmergencyRequest, db: AsyncSession = Depends(get_db)
):
    """[CREATE EMERGENCY] - Create a new emergency/alert"""
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
        e_id = emergency.id

    await db.commit()

    return {"message": "Alert Created", "alert_id": e_id}


# READ EMERGENCY
# @router.get("/api/alerts/{alert_id}", response_model=Emergency, tags=["Alerts"])
@router.get("/api/alerts/{alert_id}", tags=["Alerts"])
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """[READ EMERGENCY] - Get emergency/alert details"""
    stmt = select(Emergency).where(Emergency.id == alert_id)
    result = await db.execute(stmt)
    emergency = result.scalar_one_or_none()
    if emergency is None:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return emergency


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


@router.patch(
    "/api/alerts/{alert_id}", response_class=ORJSONResponse, tags=["Alerts"]
)
async def update_alert(
    alert_id: str,
    request: EmergencyUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update an alert"""

    stmt = select(Emergency).where(Emergency.id == alert_id)
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
    return [{"emergecy_id": str(emergency.id), "message": "Updated"}]


# DELETE A EMERGENCY
@router.delete("/api/alerts/{emergency_id}", status_code=200, tags=["Alerts"])
async def delete_device(
    db: Annotated[AsyncSession, Depends(get_db)], emergency_id: str
):
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
@router.get("/api/devices/{resource_id}/assignments", tags=["Alerts"])
async def get_device_assignments(
    resource_id: str, session: AsyncSession = Depends(get_db)
):
    """Get resources assigned to a specific emergency"""

    stmt = select(Resource).where(Resource.id == resource_id)
    result = await session.execute(stmt)
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    resource = result.unique().scalar_one()

    return resource.emergencies


class EmergencyAssignResourcesRequest(BaseModel):
    """Input for assing resources to emergency endpoint"""
    resourcesIDs: list[uuid_pkg.UUID]


# Assign resources to emergency by ID
@router.post("/api/alerts/{emergency_id}/assign", tags=["Alerts"])
async def add_device_assignments(
    emergency_id: str,
    request: EmergencyAssignResourcesRequest,
    session: AsyncSession = Depends(get_db),
):
    """Get alerts assigned to a specific device"""

    # Select Emergency From Database By emergency_id
    stmt = select(Emergency).where(Emergency.id == emergency_id)
    result = await session.execute(stmt)
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    emergency = result.unique().scalar_one()

    # Clean Old Resources Status to Available
    for resource in emergency.resources:
        stmt = select(Resource).where(Resource.id == resource.id)
        result = await session.execute(stmt)
        if not result:
            raise HTTPException(status_code=404, detail="Resource not found")
        resource = result.scalar_one()
        resource.status = ResourceStatusEnum.AVAILABLE
        session.add(resource)

    # Select Assigned Resources From Database and add to db_resources var
    db_resources = []
    for resource_id in request.resourcesIDs:
        stmt = select(Resource).where(Resource.id == resource_id)
        result = await session.execute(stmt)
        if not result:
            raise HTTPException(status_code=404, detail="Resource not found")
        resource = result.scalar_one()
        resource.status = ResourceStatusEnum.BUSY
        session.add(resource)
        db_resources.append(resource)
    session.commit()

    # Add assigned resources to emergency in the many to many table
    emergency.resources = db_resources
    session.add(emergency)
    await session.commit()
    # Refresh the emergency model to return
    await session.refresh(emergency)

    return emergency
