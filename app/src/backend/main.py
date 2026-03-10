"""
Earthworm Backend - FastAPI Application

This is the main entry point for the Earthworm backend.
It provides a bridge between the React frontend and the n8n webhook.

Architecture:
- Frontend (React) -> Backend (FastAPI) -> n8n Webhook -> AI Response

Benefits of this middle layer:
1. Security: Hide n8n URLs and API keys
2. Preprocessing: Resize images before sending to save bandwidth
3. Stability: Handle n8n errors gracefully
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

from config import settings
from models import ChatRequest, ChatResponse, HealthResponse, ErrorResponse
from services import N8NBridge, AIProviderType, AIProviderFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    logger.info("🌻 Earthworm Backend starting up...")
    
    # Pre-initialize AI provider
    try:
        provider = AIProviderFactory.get_provider(AIProviderType.N8N)
        healthy = await provider.health_check()
        if healthy:
            logger.info("✅ n8n webhook connection verified")
        else:
            logger.warning("⚠️  n8n webhook may not be accessible")
    except Exception as e:
        logger.warning(f"⚠️  Could not verify n8n connection: {e}")
    
    yield
    
    logger.info("🌻 Earthworm Backend shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Earthworm API",
    description="Agricultural AI Assistant Backend - Bridge to n8n webhook",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configure CORS - Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            detail="An unexpected error occurred. Please try again later.",
            error_code="INTERNAL_ERROR",
        ).model_dump(),
    )


# Health check endpoint
@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status and n8n connectivity
    """
    try:
        provider = AIProviderFactory.get_provider(AIProviderType.N8N)
        n8n_connected = await provider.health_check()
    except:
        n8n_connected = False
    
    return HealthResponse(
        status="healthy",
        n8n_connected=n8n_connected,
    )


# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint that forwards requests to n8n webhook.
    
    This endpoint:
    1. Accepts text, image, and audio from the frontend
    2. Preprocesses data (e.g., resizes images)
    3. Forwards to n8n webhook
    4. Returns the AI response
    
    Args:
        request: ChatRequest containing message data
        
    Returns:
        ChatResponse with AI's response
        
    Raises:
        HTTPException: If n8n is unreachable or returns error
    """
    try:
        logger.info(f"Chat request received - Session: {request.session_id}, Lang: {request.language}")
        
        # Get AI provider (n8n bridge)
        provider = AIProviderFactory.get_provider(AIProviderType.N8N)
        
        # Process the chat request
        response_text = await provider.chat(
            text=request.text,
            image_base64=request.image_base64,
            audio_file=request.audio_file,
            session_id=request.session_id,
            language=request.language,
        )
        
        logger.info(f"Chat response sent - Session: {request.session_id}")
        
        return ChatResponse(
            response=response_text,
            session_id=request.session_id,
        )
        
    except Exception as e:
        import traceback
        logger.error(f"Chat error: {type(e).__name__}: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return user-friendly error message
        error_message = str(e)
        if "n8n" in error_message.lower() or "webhook" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service is temporarily unavailable: {error_message}",
            )
        elif "timeout" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The AI service took too long to respond. Please try again.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred: {error_message}",
            )


# Test endpoint for development
@app.post("/chat/test", response_model=ChatResponse)
async def chat_test(request: ChatRequest):
    """
    Test endpoint that returns mock responses.
    
    Use this for frontend development without n8n running.
    """
    mock_responses = {
        "en": f"🧪 Test Mode: Received your message '{request.text}'. The backend is working! Connect n8n for real AI responses.",
        "ta": f"🧪 சோதனை முறை: உங்கள் செய்தியைப் பெற்றேன் '{request.text}'. பின்தளம் வேலை செய்கிறது! உண்மையான AI பதில்களுக்கு n8n ஐ இணைக்கவும்.",
    }
    
    return ChatResponse(
        response=mock_responses.get(request.language, mock_responses["en"]),
        session_id=request.session_id,
    )


# Provider switch endpoint (for admin use)
@app.get("/provider/{provider_type}")
async def switch_provider(provider_type: AIProviderType):
    """
    Switch AI provider (for testing/debugging).
    
    Args:
        provider_type: The provider type to switch to
        
    Returns:
        Confirmation message
    """
    # This is mainly for testing - in production, you'd want authentication
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider switching only available in debug mode",
        )
    
    provider = AIProviderFactory.get_provider(provider_type)
    healthy = await provider.health_check()
    
    return {
        "provider": provider_type.value,
        "healthy": healthy,
        "message": f"Switched to {provider_type.value} provider",
    }


# Run the application
if __name__ == "__main__":
    logger.info(f"🚀 Starting Earthworm Backend on {settings.host}:{settings.port}")
    logger.info(f"🌐 CORS allowed origins: {settings.cors_origins}")
    logger.info(f"🔗 n8n webhook URL: {settings.n8n_webhook_url}")
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug",
    )
