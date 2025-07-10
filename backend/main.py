"""
SERP FastAPI Service - For Emergencies Control, Monitoring and Logistics
"""
import typer
import logging
import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Config DB
from src.configs.database import sessionmanager
from src.routes import emergencies, location, qosod, resources

# Seed DB
from src.seeders.main import seed_db as seed_db_helper

from fastapi_utilities import repeat_at

# Convert string env var to boolean
def str_to_bool(s):
    """
    Convert string to boolean
    """
    return s.lower() in ["true", "True", "TRUE", "1", "yes"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Function that runs on startup the service (BEFORE starting the server)
    """
    @repeat_at(cron="* * 3 * 0") #every 2nd minute
    async def reset_db():
        print("Reset Database Data - Drop, Create Tables and Seed")
        await sessionmanager.drop_db_and_tables()
        await sessionmanager.create_db_and_tables()
        await seed_db_helper(5)
    # Initialize the DatabaseSessionManager
    await sessionmanager.create_db_and_tables()
    # # Seed Database for Demo
    # if "SEED_DB_DEMO" in os.environ and str_to_bool(
    #     os.environ["SEED_DB_DEMO"]
    # ):
    #     await seed_db(5)

    yield

    """ Functions that run when the server is terminatet"""
    print("Shutting down scheduler...")
    await scheduler.stop()
    await sessionmanager.close()  # Cleanup DB connecti


app = FastAPI(title="SERP Backend API", lifespan=lifespan)

cli = typer.Typer()

@cli.command()
def seeddb():
    """
    Seed Database for Demo
    """
    asyncio.run(seed_db_helper(5))
    print("Seeded database with 5 new emergencies and some resources")

@cli.command()
def dropdb():
    """
    Drop tables and database
    """
    asyncio.run(sessionmanager.drop_db_and_tables())



# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@cli.command()
def runserver():
    """Run the FastAPI server."""
    import uvicorn
    #uvicorn.run(app, host="0.0.0.0", port=8000)

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            os.environ["API_URL_CORS"],
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(emergencies.router)
    app.include_router(location.router)
    # app.include_router(qosod.router)
    app.include_router(resources.router)

    if "PORT" in os.environ:
        portApp = int(os.environ["PORT"])
    else:
        portApp = 5001

    uvicorn.run(app, host="0.0.0.0", port=portApp)

if __name__ == "__main__":
    cli()