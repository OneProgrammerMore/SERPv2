from typing import List, Optional, Dict
from pydantic import BaseModel, Field # type: ignore No warning about pydantic. Imported in requirements.txt
from datetime import datetime
import uuid
from fastapi import APIRouter, HTTPException, Depends # type: ignore No warning about pydantic. Imported in requirements.txt
from fastapi.responses import JSONResponse
from src.routes.qosod import QoSConfig, activate_device_qos, deactivate_device_qos

# Importar servicio de asignaciones de emergencia
# Esto es una suposición basada en el uso - necesitarás crear este módulo si no existe
from src.services.emergency_assignments import emergency_assignments
from src.configs.database import get_db
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload


from enum import Enum

from src.models.emergency import Emergency, EmergencyType, StatusType, PriorityType
from src.models.resource import Resource, ResourceStatusEnum
from src.models.location import Location
from src.models.address import Address

import json

import uuid as uuid_pkg
from fastapi.responses import ORJSONResponse

router = APIRouter()



def convertToDict(alqModel):
    return [MyModelSchema(**item.__dict__) for item in alqModel]



# LIST ALL EMERGENCIES
# @router.get("/api/alerts", response_model=List[Emergency], tags=["Alerts"])
@router.get("/api/alerts", tags=["Alerts"])
async def list_alerts(session: Annotated[AsyncSession, Depends(get_db)]):
    """List all alerts"""
    # emergencies = await session.execute(select(Emergency))
    # items = emergencies.scalars().all()
    # return items

    emergencies = await session.execute(select(
        Emergency, Location).join(Location, Location.id == Emergency.location_emergency)
    )
    result = emergencies.all()
    emergencies_with_location = []
    for emergency, location_emergency in result:
        print("DEBUG LOCATION EMERGENCY", location_emergency)
        emergencies_with_location.append({**emergency.dict(), "location_emergency_data": location_emergency.dict()})
    return emergencies_with_location


# CREATE EMERGENCY
class EmergencyRequest(BaseModel):
    name: str = Field(..., max_length=64)
    description: str = Field(..., max_length=512)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    emergency_type: EmergencyType
    priority: PriorityType
    status: StatusType
    # Non-optional fields
    name_contact: Optional[str]  = None
    telephone_contact: Optional[str]  = None
    id_contact: Optional[str]  = None


@router.post("/api/alerts", response_model=Emergency, status_code=201, tags=["Alerts"])
async def create_alert(request: EmergencyRequest, db: AsyncSession = Depends(get_db)):
    """Create a new alert"""
    async with db.begin():  # Ensures rollback on failure
        location = Location(
            latitude=request.latitude,
            longitude=request.longitude
        )
        db.add(location)
        await db.flush()  # Get user.id before committing

        #For future implementations
        address = Address(
            latitude=request.latitude,
            longitude=request.longitude
        )
        db.add(address)
        await db.flush()  # Get product.id before committing

        emergency = Emergency(
            name=request.name,
            description=request.description,
            location_emergency=location.id,
            address_emergency=address.id,
            priority=request.priority,
            status=request.status,
            name_contact=request.name_contact,
            telephone_contact=request.telephone_contact,
            id_contact=request.id_contact
        )
        db.add(emergency)
        e_id =  emergency.id

    await db.commit()
    
    return {"message": "Alert Created", "alert_id": e_id}

# READ EMERGENCY
# @router.get("/api/alerts/{alert_id}", response_model=Emergency, tags=["Alerts"])
@router.get("/api/alerts/{alert_id}", tags=["Alerts"])
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Get alert details"""
    stmt = select(Emergency).where(Emergency.id == alert_id)
    result = await db.execute(stmt)
    emergency = result.scalar_one_or_none()
    if emergency is None:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return emergency


# UPDATE EMERGENCY
class EmergencyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str]  = None
    priority: Optional[PriorityType]  = None
    emergency_type: Optional[EmergencyType]  = None
    status: Optional[StatusType]  = None

    location_emergency: Optional[uuid_pkg.UUID]  = None
    address_emergency: Optional[uuid_pkg.UUID]  = None

    resource_id: Optional[uuid_pkg.UUID]  = None
    location_resource: Optional[uuid_pkg.UUID]  = None
    address_resource: Optional[uuid_pkg.UUID]  = None

    destination_id: Optional[uuid_pkg.UUID]  = None
    location_destination: Optional[uuid_pkg.UUID]  = None
    address_destination: Optional[uuid_pkg.UUID]  = None

    # Non-optional fields
    name_contact: Optional[str]  = None
    telephone_contact: Optional[str]  = None
    id_contact: Optional[str]  = None

from src.models.emergencyresourceslink import EmergencyResourceLink

@router.patch("/api/alerts/{alert_id}", response_class=ORJSONResponse, tags=["Alerts"])
async def update_alert(alert_id: str, request: EmergencyUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update an alert"""
    stmt = select(Emergency).where(Emergency.id == alert_id)
    result = await db.execute(stmt)
    emergency = result.scalars().first() 
    if not emergency:
        raise HTTPException(status_code=404, detail="Example not found")

    #Update Emergency
    for field, value in request.dict(exclude_unset=True).items():
        setattr(emergency, field, value)
    # for field, value in vars(request).items():
    #     setattr(emergency, field, value)

    # emergency.modified = modified_now
    db.add(emergency)
    await db.commit()

    await db.refresh(emergency)
    # await db.refresh(emergency.scalars().first())

    # Si estamos resolviendo la alerta
    if emergency.status == StatusType.SOLVED:
        print("DEBUG - EmergecnydID ", emergency)
        # print(dir(emergency.fetchone()))
        #Get associated Resources
        statement = (
            select(Resource)
            .join(EmergencyResourceLink, Resource.id == EmergencyResourceLink.resource_id)
            .where(EmergencyResourceLink.emergency_id == emergency.id)
        )
        results = await db.execute(statement)
        emergencies = results.scalars().all() 
        #Deactivate QoS
        for device in emergencies:
            print("To Do - Deactivate QOSOD for Device", device.id)

        # return {"message": "Emergency updated to solved and devices cleaned", "emergecy_id": emergency.id}
        response =  [{"emergecy_id": str(emergency.id), "message": "Updated"}]
        print("DEBUG - Respone", response)
        return response

    
    # return {"message": "Emergency updated", "emergecy_id": emergency.id}
    return [{"emergecy_id": str(emergency.id), "message": "Updated"}]

# DELETE A EMERGENCY
@router.delete("/api/alerts/{emergency_id}", status_code=200, tags=["Alerts"])
async def delete_device(db: Annotated[AsyncSession, Depends(get_db)], emergency_id: str):
    """Delete an emergency"""

    try:
        emergency_uuid = uuid_pkg.UUID(emergency_id)  # Convert to UUID type
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")


    #Fetch Resource From DB From ID
    stmt = select(Emergency).where(Emergency.id == emergency_uuid)
    result = await db.execute(stmt)
    emergency = result.scalars().first() 
    if not emergency:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    #Delete Emergency
    await db.delete(emergency)
    await db.commit()
    
    return {"message": "Emergency Deleted"}







#CHECK AFTER CRUD

# @router.get("/api/devices/{device_id}/assignments", response_model=List[Alert], tags=["Devices"])
# async def get_device_assignments(device_id: str):
#     """Get alerts assigned to a specific device"""
#     if device_id not in devices:
#         raise HTTPException(status_code=404, detail="Device not found")
    
#     device = devices[device_id]
#     device_type = device.type
#     alert_type = get_alert_type_for_device(device_type)
    
#     assigned_alerts = []
#     for alert_id, alert in alerts.items():
#         if alert.status == "active" and alert.type == alert_type:
#             if device_id in emergency_assignments.get_alert_devices(alert_id):
#                 assigned_alerts.append(alert)
    
#     return assigned_alerts


# I DO NOT KNOW WHAT IS IT FOR - ^^' - To Do - Check IF it works
# @router.get("/api/devices/{resource_id}/assignments", response_model=List[Emergency], tags=["Alerts"])
@router.get("/api/devices/{resourceID}/assignments", tags=["Alerts"])
async def get_device_assignments(resourceID: str, session: AsyncSession = Depends(get_db)):
    """Get resources assigned to a specific emergency"""
    # stmt = select(Resource).where(Resource.id == resource_id)
    # result = await db.execute(stmt)
    # if not result:
    #     raise HTTPException(status_code=404, detail="Example not found")
    # return result.scalars().first()
    stmt = select(Resource).where(Resource.id == resourceID)
    result = (await session.execute(stmt))
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    resource = result.unique().scalar_one()

    return resource.emergencies


class EmergencyAssignResourcesRequest(BaseModel):
    resourcesIDs: list[uuid_pkg.UUID]

#Assign resources to emergency by ID
@router.post("/api/alerts/{emergencyID}/assign", tags=["Alerts"])
async def add_device_assignments(emergencyID: str, request: EmergencyAssignResourcesRequest, session: AsyncSession = Depends(get_db)):
    """Get alerts assigned to a specific device"""
    
    #Select Emergency From Database By emergencyID
    stmt = select(Emergency).where(Emergency.id == emergencyID)
    result = (await session.execute(stmt))
    if not result:
        raise HTTPException(status_code=404, detail="Example not found")
    emergency = result.unique().scalar_one()

    #Clean Old Resources Status to Available
    for resource in emergency.resources:
        stmt = select(Resource).where(Resource.id == resource.id)
        result = await session.execute(stmt)
        if not result:
            raise HTTPException(status_code=404, detail="Resource not found")
        resource = result.scalar_one()
        resource.status = ResourceStatusEnum.AVAILABLE
        session.add(resource)

    #Select Assigned Resources From Database and add to db_resources var
    db_resources = []
    for resourceID in request.resourcesIDs:
        stmt = select(Resource).where(Resource.id == resourceID)
        result = await session.execute(stmt)
        if not result:
            raise HTTPException(status_code=404, detail="Resource not found")
        resource = result.scalar_one()
        resource.status = ResourceStatusEnum.BUSY
        session.add(resource)
        db_resources.append(resource)
    session.commit()

    #Add assigned resources to emergency in the many to many table
    emergency.resources = db_resources
    session.add(emergency)
    await session.commit()
    #Refresh the emergency model to return
    await session.refresh(emergency)

    return emergency