"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ChatRequest(BaseModel):
    """Chat request model."""
    text: Optional[str] = Field(
        default=None,
        description="Text message from the user",
        examples=["How do I treat tomato blight?"]
    )
    image_base64: Optional[str] = Field(
        default=None,
        description="Base64-encoded image for analysis",
    )
    audio_file: Optional[str] = Field(
        default=None,
        description="Base64-encoded audio file (STT)",
    )
    session_id: str = Field(
        ...,
        description="Unique session identifier",
        examples=["session_abc123"]
    )
    language: Literal["en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa"] = Field(
        default="en",
        description="Language code for the assistant response",
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "How do I treat tomato blight?",
                "session_id": "session_abc123",
                "language": "en"
            }
        }


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str = Field(
        ...,
        description="AI assistant's response",
    )
    session_id: str = Field(
        ...,
        description="Session identifier",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Response timestamp in ISO format",
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "To treat tomato blight, remove affected leaves...",
                "session_id": "session_abc123",
                "timestamp": "2024-01-15T10:30:00.000000"
            }
        }


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = "healthy"
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
    )
    version: str = "1.0.0"
    n8n_connected: bool = False


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str
    error_code: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
    )
