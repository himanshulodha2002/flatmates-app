"""
Configuration settings for the Flatmates App API.
Uses Pydantic Settings for environment variable management.
"""

from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    PROJECT_NAME: str = "Flatmates App API"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str

    # Redis (optional)
    REDIS_URL: str = ""

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Google Gemini AI
    GEMINI_API_KEY: str = ""

    # OpenAI / GitHub Models
    OPENAI_API_KEY: str = ""  # Can be GitHub token for GitHub Models
    OPENAI_BASE_URL: str = "https://models.inference.ai.azure.com"  # GitHub Models endpoint
    OPENAI_MODEL: str = "gpt-4o"  # Default model

    # AI Provider Selection
    AI_PROVIDER: str = "gemini"  # Options: "gemini", "openai", "auto"
    
    # Observability
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = False  # For OpenTelemetry
    SENTRY_DSN: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from JSON string or list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")


# Create global settings instance
settings = Settings()
