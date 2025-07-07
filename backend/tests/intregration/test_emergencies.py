"""
Tests for the emergency model related CRUD
"""
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_read_emergencies():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    # Check that the user is present in the database BEFORE rollback
    # user = db.query(User).filter_by(name="Alice").first()
    # assert user is not None
    # assert user.name == "Alice"

# @router.post("/api/alerts/{emergency_id}/assign", response_model=EmergencyModelResponse)
# async def minimal_test(
#     emergency_id: UUID,
#     request: EmergencyAssignResourcesRequest,
#     session: AsyncSession = Depends(get_db),
# ) -> EmergencyModelResponse:
#     stmt = select(Emergency).where(Emergency.id == emergency_id)
#     result = await session.execute(stmt)
#     emergency = result.scalar_one_or_none()
#     if emergency is None:
#         raise HTTPException(status_code=404, detail="Emergency not found")
    
#     emergency_response = EmergencyModelResponse.from_orm(emergency)
#     return emergency_response
