"""
Abstract base class and implementations for AI providers.
This modular design allows easy swapping between different AI backends.
"""
from abc import ABC, abstractmethod
from typing import Optional, Literal
from enum import Enum
import base64
import io
from PIL import Image


class AIProviderType(str, Enum):
    """Available AI provider types."""
    N8N = "n8n"
    OPENAI = "openai"
    GEMINI = "gemini"
    MOCK = "mock"


class AIProvider(ABC):
    """
    Abstract base class for AI providers.
    Implement this interface to add support for new AI backends.
    """
    
    @abstractmethod
    async def chat(
        self,
        text: Optional[str],
        image_base64: Optional[str],
        audio_file: Optional[str],
        session_id: str,
        language: Literal["en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa"],
    ) -> str:
        """
        Send a chat request to the AI provider.
        
        Args:
            text: The user's text message
            image_base64: Optional base64-encoded image
            audio_file: Optional base64-encoded audio
            session_id: Unique session identifier
            language: Language code ('en' or 'ta')
            
        Returns:
            The AI's response text
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the AI provider is available."""
        pass
    
    def preprocess_image(
        self,
        image_base64: str,
        max_width: int = 1920,
        max_height: int = 1080,
        quality: int = 85,
    ) -> str:
        """
        Preprocess an image to reduce size before sending to AI.
        
        Args:
            image_base64: Base64-encoded image
            max_width: Maximum width
            max_height: Maximum height
            quality: JPEG quality (0-100)
            
        Returns:
            Resized base64-encoded image
        """
        try:
            # Decode base64
            image_data = base64.b64decode(image_base64.split(",")[-1])
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            # Calculate new size
            width, height = image.size
            if width > max_width or height > max_height:
                ratio = min(max_width / width, max_height / height)
                new_size = (int(width * ratio), int(height * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Encode back to base64
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG', quality=quality, optimize=True)
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return image_base64  # Return original on error


class MockAIProvider(AIProvider):
    """Mock AI provider for testing without external dependencies."""
    
    async def chat(
        self,
        text: Optional[str],
        image_base64: Optional[str],
        audio_file: Optional[str],
        session_id: str,
        language: Literal["en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa"],
    ) -> str:
        """Return a mock response."""
        responses = {
            "en": f"Mock response: I received your message '{text}'. The backend is working correctly!",
            "ta": f"மாக் பதில்: உங்கள் செய்தியைப் பெற்றேன் '{text}'. பின்தளம் சரியாக வேலை செய்கிறது!",
        }
        return responses.get(language, responses["en"])
    
    async def health_check(self) -> bool:
        """Always healthy."""
        return True


# Provider factory
class AIProviderFactory:
    """Factory for creating AI provider instances."""
    
    _providers: dict = {}
    
    @classmethod
    def get_provider(cls, provider_type: AIProviderType) -> AIProvider:
        """Get or create an AI provider instance."""
        if provider_type not in cls._providers:
            if provider_type == AIProviderType.MOCK:
                cls._providers[provider_type] = MockAIProvider()
            else:
                # Import and create specific providers on demand
                if provider_type == AIProviderType.N8N:
                    from .n8n_bridge import N8NBridge
                    cls._providers[provider_type] = N8NBridge()
                else:
                    raise ValueError(f"Unknown provider type: {provider_type}")
        
        return cls._providers[provider_type]
    
    @classmethod
    def clear_cache(cls):
        """Clear provider cache (useful for testing)."""
        cls._providers.clear()
