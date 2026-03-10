"""
Configuration module for Earthworm backend.
Loads settings from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS settings
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # n8n Webhook Configuration
    n8n_webhook_url: str = "http://localhost:5678/webhook/earthworm"
    n8n_api_key: str = ""
    
    # Optional: Direct AI Provider Configuration
    openai_api_key: str = ""
    gemini_api_key: str = ""
    
    # Image processing settings
    max_image_width: int = 1920
    max_image_height: int = 1080
    image_quality: int = 60
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse allowed origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
