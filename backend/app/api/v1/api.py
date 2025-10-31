"""
API v1 router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, shopping

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Include shopping endpoints
api_router.include_router(shopping.router, prefix="/shopping", tags=["shopping"])
