""" Init the models in the database """

from sqlmodel import SQLModel

from src.configs.database import Base
from src.models.address import Address
from src.models.emergency import Emergency
from src.models.emergencyresourceslink import EmergencyResourceLink
from src.models.location import Location
from src.models.resource import Resource
from src.models.user import User

metadata = SQLModel.metadata
