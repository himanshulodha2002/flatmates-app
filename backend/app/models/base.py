"""
Base model imports and configurations.
Import all models here for Alembic auto-generation.
"""

from app.core.database import Base

# Import all models here for Alembic to detect
from app.models.user import User  # noqa: F401
from app.models.household import Household, HouseholdMember  # noqa: F401
from app.models.shopping import ShoppingList, ShoppingItem  # noqa: F401

__all__ = ["Base"]
