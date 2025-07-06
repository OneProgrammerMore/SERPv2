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
