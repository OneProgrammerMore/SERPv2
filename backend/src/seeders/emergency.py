"""
Seeder for emergencies database model
"""

import random
import string
import uuid as uuid_pkg

from faker import Faker

from src.configs.database import get_db
from src.models.emergency import (
    Emergency,
    EmergencyType,
    PriorityType,
    StatusType,
)
from src.seeders.address import address_seeder
from src.seeders.location import location_seeder
from src.seeders.resource import resource_seeder

async def emergency_seeder()->uuid_pkg.UUID:
    """
    Creates an emergency in the database and returns its ID
    """
    fake = Faker()
    resources_names = ["Fire", "Heart Attack", "Accident"]

    location_emergency = await location_seeder()
    address_emergency = await address_seeder()

    resource = await resource_seeder()

    destination = await resource_seeder()

    id_contact = "".join(random.choices(string.digits, k=7)) + random.choice(
        string.ascii_uppercase
    )

    emergency_seed = Emergency(
        name=random.choice(resources_names) + "-" + str(random.randint(100, 999)),
        description="That's a pseudorandom type for an emergency",
        priority=random.choice(list(PriorityType)),
        emergency_type=random.choice(list(EmergencyType)),
        status=random.choice(list(StatusType)),

        location_emergency=location_emergency,
        address_emergency=address_emergency,

        resource_id=resource.id,
        location_resource=resource.actual_location,
        address_resource=resource.actual_address,

        destination_id=destination.id,
        location_destination=destination.actual_location,
        address_destination=destination.actual_address,

        name_contact=fake.first_name(),
        telephone_contact=fake.phone_number(),
        id_contact=id_contact,
    )

    async for db_session in get_db():
        async with db_session as db:
            db.add(emergency_seed)
            await db.commit()
            await db.refresh(emergency_seed)
    return emergency_seed.id
