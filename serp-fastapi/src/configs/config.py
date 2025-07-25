"""Database configs for SERP Project"""

import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv(".env", verbose=True)


class Settings(BaseModel):
    """Database sttings from env file"""

    POSTGRES_HOST: Optional[str] = os.getenv("POSTGRES_HOST")
    POSTGRES_PASSWORD: Optional[str] = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_USER: Optional[str] = os.getenv("POSTGRES_USER")
    POSTGRES_DB: Optional[str] = os.getenv("POSTGRES_DB")
    POSTGRES_PORT: Optional[str] = os.getenv("POSTGRES_PORT")


settings = Settings()
