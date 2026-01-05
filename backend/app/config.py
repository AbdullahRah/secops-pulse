"""
Configuration settings for SecOps Pulse API.
Loads environment variables and provides type-safe configuration access.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables.
    All settings have sensible defaults for development.
    """

    # Application settings
    APP_NAME: str = "SecOps Pulse"
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_VERSION: str = "v1"

    # Database configuration
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://secops_user:secops_password@localhost:5432/secops_pulse",
        description="PostgreSQL database connection URL",
    )

    # Google Gemini AI configuration
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Gemini API key for AI-powered analysis",
    )
    AI_MODEL: str = Field(
        default="gemini-1.5-flash",
        description="Gemini model to use for analysis (gemini-1.5-flash, gemini-1.5-pro, etc.)",
    )
    AI_TEMPERATURE: float = Field(
        default=0.2,
        description="AI model temperature (lower = more consistent responses)",
    )

    # Risk scoring thresholds
    HIGH_RISK_THRESHOLD: int = Field(
        default=7,
        description="Score threshold for high-risk incidents (0-10 scale)",
    )
    MEDIUM_RISK_THRESHOLD: int = Field(
        default=4,
        description="Score threshold for medium-risk incidents (0-10 scale)",
    )

    # Alert configuration
    ALERT_COOLDOWN_SECONDS: int = Field(
        default=300,
        description="Minimum time between duplicate alerts",
    )
    MAX_EVENTS_PER_INCIDENT: int = Field(
        default=100,
        description="Maximum events to group into a single incident",
    )

    def __init__(self, **values):
        super().__init__(**values)
        
        # Support Railway/Heroku PORT environment variable
        env_port = os.getenv("PORT")
        if env_port:
            self.API_PORT = int(env_port)
            
        # Standardize DATABASE_URL for SQLAlchemy + asyncpg
        # Railway provides "postgres://" which must be "postgresql+asyncpg://"
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.DATABASE_URL.startswith("postgresql://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


# Global settings instance
settings = get_settings()
