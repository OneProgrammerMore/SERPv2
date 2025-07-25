"""
Tests for the emergency model related CRUD
"""

import pytest

from sqlalchemy import select

from src.models.emergency import Emergency
from src.services.helpers import convertStringToUUID

pytestmark = pytest.mark.asyncio


@pytest.fixture
def emergency_data():
    """
    Returns an emergency data to create an emergency as emergency request model
    """
    return {
        "name": "Test Emergency",
        "description": "Description for Test Emergency",
        "latitude": 45.5,
        "longitude": 120,
        "emergency_type": "Accident",
        "priority": "High",
        "status": "Active",
        "name_contact": "Fake Name Surname",
        "telephone_contact": "+654986226 449",
        "id_contact": "51446981238J",
    }


@pytest.fixture
def emergency_data_update():
    """
    Returns an emergency data to update an emergency as emergency request model
    """
    return {
        "name": "Test Emergency UPDATE",
        "description": "Description for Test Emergency UPDATE",
        "latitude": 50.5,
        "longitude": 110,
        "emergency_type": "Fire",
        "priority": "Low",
        "status": "Pending",
        "name_contact": "Fake Name Surname Updated",
        "telephone_contact": "+654986226 222",
        "id_contact": "6554654654654J",
    }


@pytest.mark.asyncio
async def test_read_emergencies_empty(client):
    """
    Test that tries to read all emergencies
    """
    response = await client.get("/api/emergencies")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_create_emergency_with_db_check(
    client, emergency_data, db_session
):
    """
    Test that creates a new emergency and checks it afterwards in db
    """
    response = await client.post("/api/emergencies", json=emergency_data)
    assert response.status_code == 201

    print(response)
    data = response.json()
    assert data["message"] == "Emergency Created"
    print('data["emergency_id"]', data["emergency_id"])
    # Verify commit in database
    await db_session.flush()
    emergency_id = convertStringToUUID(data["emergency_id"])
    result = await db_session.execute(
        select(Emergency).where(Emergency.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()
    assert emergency.name == emergency_data["name"]


@pytest.mark.asyncio
async def test_read_created_emergency(client, emergency_data):
    """
    Test that creates a new emergency and checks it afterwards
    """

    response = await client.get("/api/emergencies")
    assert response.status_code == 200

    response = await client.post("/api/emergencies", json=emergency_data)
    assert response.status_code == 201

    data = response.json()
    emergency_id = data["emergency_id"]

    response = await client.get("/api/emergencies")
    assert response.status_code == 200

    data_after_creation = response.json()
    # Filter python objects with list comprehensions
    created_emergency = [
        x for x in data_after_creation if x["id"] == emergency_id
    ][0]

    assert created_emergency["id"] == emergency_id
    assert created_emergency["name"] == emergency_data["name"]
    assert created_emergency["description"] == emergency_data["description"]
    assert (
        created_emergency["location_emergency_data"]["latitude"]
        == emergency_data["latitude"]
    )
    assert (
        created_emergency["location_emergency_data"]["longitude"]
        == emergency_data["longitude"]
    )
    assert (
        created_emergency["emergency_type"] == emergency_data["emergency_type"]
    )
    assert created_emergency["priority"] == emergency_data["priority"]
    assert created_emergency["status"] == emergency_data["status"]
    assert created_emergency["name_contact"] == emergency_data["name_contact"]
    assert (
        created_emergency["telephone_contact"]
        == emergency_data["telephone_contact"]
    )
    assert created_emergency["id_contact"] == emergency_data["id_contact"]


@pytest.mark.asyncio
async def test_update_created_emergency(
    client, emergency_data, emergency_data_update
):
    """
    Test that creates a new emergency, updates it and check that is has been correclty updated
    """

    # Create Emergency
    response = await client.post("/api/emergencies", json=emergency_data)
    assert response.status_code == 201

    # Update Emergency
    data = response.json()
    emergency_id_created = data["emergency_id"]

    url = "/api/emergencies/" + emergency_id_created
    response = await client.patch(url, json=emergency_data_update)
    assert response.status_code == 201

    data = response.json()
    emergency_id_updated = data["emergency_id"]

    # Fetch All Emergencies
    response = await client.get("/api/emergencies")
    assert response.status_code == 200

    assert emergency_id_updated == emergency_id_created

    data_after_update = response.json()
    # Filter python objects with list comprehensions
    updated_emergency = [
        x for x in data_after_update if x["id"] == emergency_id_updated
    ][0]

    assert updated_emergency["id"] == emergency_id_updated
    assert updated_emergency["name"] == emergency_data_update["name"]
    assert (
        updated_emergency["description"]
        == emergency_data_update["description"]
    )
    assert (
        updated_emergency["location_emergency_data"]["latitude"]
        == emergency_data_update["latitude"]
    )
    assert (
        updated_emergency["location_emergency_data"]["longitude"]
        == emergency_data_update["longitude"]
    )
    assert (
        updated_emergency["emergency_type"]
        == emergency_data_update["emergency_type"]
    )
    assert updated_emergency["priority"] == emergency_data_update["priority"]
    assert updated_emergency["status"] == emergency_data_update["status"]
    assert (
        updated_emergency["name_contact"]
        == emergency_data_update["name_contact"]
    )
    assert (
        updated_emergency["telephone_contact"]
        == emergency_data_update["telephone_contact"]
    )
    assert (
        updated_emergency["id_contact"] == emergency_data_update["id_contact"]
    )


@pytest.mark.asyncio
async def test_delete_created_emergency(client, emergency_data):
    """
    Test that creates a new emergency, deletes it and check that is has been correclty deleted
    """

    # Create Emergency
    response = await client.post("/api/emergencies", json=emergency_data)
    assert response.status_code == 201

    data = response.json()
    emergency_id_created = data["emergency_id"]

    # Delete Emergencies
    url = "/api/emergencies/" + emergency_id_created
    response = await client.delete(url)
    assert response.status_code == 200

    # Read all Emergencies
    response = await client.get("/api/emergencies")
    assert response.status_code == 200

    data_after_delete = response.json()
    # Filter python objects with list comprehensions
    updated_emergency = [
        x for x in data_after_delete if x["id"] == emergency_id_created
    ]
    assert len(updated_emergency) == 0
