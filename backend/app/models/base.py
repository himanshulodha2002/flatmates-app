"""
Base model imports and configurations.
Import all models here for Alembic auto-generation.
"""

from app.core.database import Base

# Import all models here for Alembic to detect
# Example:
# from app.models.user import User
# from app.models.expense import Expense

__all__ = ["Base"]
