"""
Main seeding functions
"""

from src.seeders.emergency import emergency_seeder


async def seed_db(emergencies_amount) -> None:
    """
    Seeds the database
    """
    for _ in range(emergencies_amount):  # Seed 10 random records
        await emergency_seeder()
