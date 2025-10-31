"""
API v1 router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, todos

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Include todos endpoints
api_router.include_router(todos.router, prefix="/todos", tags=["todos"])
