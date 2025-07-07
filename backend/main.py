"""SERP FastAPI Service - For Emergencies Control, Monitoring and Logistics"""

import logging
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Get Settings
#from src.configs.config import settings

# Config DB
from src.configs.database import sessionmanager
from src.routes import emergencies, location, qosod, resources

# Seed DB
from src.seeders.main import seed_db

# Convert string env var to boolean
def str_to_bool(s):
    return s.lower() in ['true', 'True', 'TRUE', '1', 'yes']


# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """"Function that runs on startup the service (BEFORE starting the server)"""
    # Initialize the DatabaseSessionManager
    await sessionmanager.create_db_and_tables()
    # Seed Database for Demo
    if "SEED_DB_DEMO" in os.environ and str_to_bool(os.environ["SEED_DB_DEMO"]):
        await seed_db()
    
    yield
    """ Functions that run when the server is terminatet"""
    await sessionmanager.close()  # Cleanup DB connecti


app = FastAPI(title="SERP Backend API", lifespan=lifespan)


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



# @app.on_event("startup")
# async def startup_event():
#     """"Function that runs on startup the service (BEFORE starting the server)"""
#     # Initialize the DatabaseSessionManager
#     await sessionmanager.create_db_and_tables()
#     # Seed Database for Demo
#     if "SEED_DB_DEMO" in os.environ and os.environ["SEED_DB_DEMO"] == True:
#         await seed_db()


# @app.on_event("shutdown")
# async def shutdown():
#     """ Functions that run when the server is terminatet"""
#     await sessionmanager.close()  # Cleanup DB connecti
