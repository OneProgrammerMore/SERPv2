from .src.seeders.main import seed_db
from .src.configs.config import settings
from .src.configs.database import get_db

import argparse
import asyncio

def main():
    parser = argparse.ArgumentParser(description="Seed the PostgreSQL database.")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Run the database seeder, use --seed flag to run the seeder for the database (5 new resources)",
    )
    args = parser.parse_args()

    if args.seed:
        asyncio.run(seed_db(5))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()