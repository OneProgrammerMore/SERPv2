"""
Seeder to create locations in the database
"""

import random

from src.configs.database import get_db
from src.models.location import Location
import uuid as uuid_pkg

async def location_seeder()->uuid_pkg.UUID:
    """
    Creates a localtion in the database and returns its ID
    """
    latitude: float = round(random.uniform(41.26, 41.47), 6)
    longitude: float = round(random.uniform(2.03, 2.25), 6)
    accuracy: float = round(random.uniform(0, 200), 5)
    speed: float = round(random.uniform(0, 360), 3)
    heading: float = round(random.uniform(0, 360), 5)

    location_seed = Location(
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        speed=speed,
        heading=heading,
    )

    async for db_session in get_db():
        async with db_session as db:
            db.add(location_seed)
            await db.commit()
            await db.refresh(location_seed)
    return location_seed.id
