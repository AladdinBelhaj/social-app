"""
Configuration module for the Messaging Microservice.

Loads settings from environment variables with sensible defaults.
Designed for microservice architecture with external Auth Service.
"""

import os
from typing import Optional
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""
    
    # Service identification
    SERVICE_NAME: str = "messaging-service"
    SERVICE_VERSION: str = "1.0.0"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database settings (MySQL XAMPP)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+aiomysql://root:@localhost/social_messaging"
    )
    DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "true").lower() == "true"
    
    # Auth Service settings
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:4000")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "SMAPP_JWT_SECRET")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Development mode (enables fallback auth for testing)
    DEV_MODE: bool = os.getenv("DEV_MODE", "true").lower() == "true"
    
    # API Gateway settings
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/messaging")
    
    # CORS settings (comma-separated origins)
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = int(os.getenv("WS_HEARTBEAT_INTERVAL", "30"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Returns:
        Settings: Application settings
    """
    return Settings()


settings = get_settings()
