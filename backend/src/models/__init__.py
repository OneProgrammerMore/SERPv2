from src.configs.database import Base


from src.models.user import User
from src.models.emergency import Emergency
from src.models.resource import Resource
from src.models.address import Address
from src.models.location import Location
from src.models.emergencyresourceslink import EmergencyResourceLink

from sqlmodel import SQLModel

metadata = SQLModel.metadata