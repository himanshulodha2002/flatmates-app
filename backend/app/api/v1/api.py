"""
API v1 router that includes all endpoint routers.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, households, todos, expenses, shopping

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Include household endpoints
api_router.include_router(households.router, prefix="/households", tags=["households"])

# Include todo endpoints
api_router.include_router(todos.router, prefix="/todos", tags=["todos"])

# Include expense endpoints
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])

# Include shopping endpoints
api_router.include_router(shopping.router, prefix="/shopping-lists", tags=["shopping"])
