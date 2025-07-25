"""
Routes For Quality On Demand - To Do For version 0.003
"""

# # Import Nokia Api Service
# from fastapi import (  # type: ignore No warning about pydantic. Imported in requirements.txt
#     APIRouter,
#     HTTPException,
# )
# from pydantic import (  # type: ignore No warning about pydantic. Imported in requirements.txt
#     BaseModel,
# )

# from src.services.opencameragateway import nokia_api_call

# # from src.routes.resources import devices


# router = APIRouter()


# class QoSConfig(BaseModel):
#     priority_level: int = 5
#     duration_minutes: int = 30


# # QoS endpoints
# @router.post("/api/devices/{device_id}/qos", tags=["QoS"])
# async def activate_device_qos(device_id: str, config: QoSConfig):
#     """Activate QoS for a device"""
#     if device_id not in devices:
#         raise HTTPException(status_code=404, detail="Device not found")

#     try:
#         response = await nokia_api_call(
#             "POST",
#             "qos",
#             {
#                 "device_id": device_id,
#                 "priority_level": config.priority_level,
#                 "duration_minutes": config.duration_minutes,
#                 "service_type": "emergency",
#             },
#         )

#         devices[device_id].qos_status = "active"
#         devices[device_id].qos_request_id = response["request_id"]
#         return response
#     except Exception as e:
#         devices[device_id].qos_status = "inactive"
#         devices[device_id].qos_request_id = None
#         raise


# @router.delete("/api/devices/{device_id}/qos", status_code=204, tags=["QoS"])
# async def deactivate_device_qos(device_id: str):
#     """Deactivate QoS for a device"""
#     if device_id not in devices:
#         raise HTTPException(status_code=404, detail="Device not found")

#     if not devices[device_id].qos_request_id:
#         raise HTTPException(
#             status_code=404, detail="No active QoS session found"
#         )

#     await nokia_api_call("DELETE", f"qos/{devices[device_id].qos_request_id}")

#     devices[device_id].qos_status = "inactive"
#     devices[device_id].qos_request_id = None
#     return None  # Explicitly return None for 204 response

# #
# # END QOS ENDPOINTS
