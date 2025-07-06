"""
Seeder for addresses database model
"""

import random

from faker import Faker

from src.configs.database import get_db
from src.models.address import Address

fake = Faker()


async def address_seeder():
    """
    Creates an address in the database and returns its ID
    """
    street_number = str(random.randint(1, 9999))
    street_name = fake.street_name()
    neighborhood = fake.street_name() + "Negihbourhood"
    city = "Barcelona"
    state = fake.state()
    postal_code = fake.zipcode()
    country = fake.country()
    country_code = ""
    latitude = round(random.uniform(0, 360), 5)
    longitude = round(random.uniform(0, 360), 5)
    address_line_1 = "This is an example line as address line"

    address_seed = Address(
        street_number=street_number,
        street_name=street_name,
        neighborhood=neighborhood,
        city=city,
        state=state,
        postal_code=postal_code,
        country=country,
        country_code=country_code,
        latitude=latitude,
        longitude=longitude,
        address_line_1=address_line_1,
    )
    async for db_session in get_db():
        async with db_session as db:
            db.add(address_seed)
            await db.commit()
            await db.refresh(address_seed)
    return address_seed.id
