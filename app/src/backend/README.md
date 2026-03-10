# Earthworm Backend

A FastAPI-based bridge service that connects the Earthworm frontend to n8n webhooks for AI-powered agricultural assistance.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   React     │────▶│   FastAPI    │────▶│     n8n     │────▶│    AI    │
│  Frontend   │◀────│   Backend    │◀────│   Webhook   │◀────│  Service │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
```

## Features

- **CORS Enabled**: Full cross-origin support for frontend communication
- **Image Preprocessing**: Automatically resizes images before forwarding to save bandwidth
- **Error Handling**: Graceful handling of n8n downtime with user-friendly messages
- **Modular Design**: Easy to swap n8n for direct OpenAI/Gemini integration
- **Health Checks**: Monitor n8n connectivity status
- **Multi-language Support**: English and Tamil language handling

## Quick Start

### Option 1: Using the startup script

```bash
cd src/backend
chmod +x start.sh
./start.sh
```

### Option 2: Manual setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
python main.py
```

## Configuration

Edit `.env` file:

```env
# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# n8n Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/earthworm
N8N_API_KEY=your_api_key_here
```

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0",
  "n8n_connected": true
}
```

### Chat
```http
POST /chat
Content-Type: application/json

{
  "text": "How do I treat tomato blight?",
  "image_base64": "base64encodedstring...",
  "audio_file": "base64encodedstring...",
  "session_id": "session_abc123",
  "language": "en"
}
```

Response:
```json
{
  "response": "To treat tomato blight, remove affected leaves...",
  "session_id": "session_abc123",
  "timestamp": "2024-01-15T10:30:05"
}
```

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── models.py            # Pydantic request/response models
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
├── start.sh             # Startup script
└── services/
    ├── __init__.py
    ├── ai_provider.py   # Abstract AI provider interface
    ├── n8n_bridge.py    # n8n webhook bridge implementation
    └── image_processor.py # Image preprocessing utilities
```

## Extending with New AI Providers

To add a new AI provider (e.g., OpenAI):

1. Create a new file in `services/`:

```python
# services/openai_provider.py
from .ai_provider import AIProvider

class OpenAIProvider(AIProvider):
    async def chat(self, text, image_base64, audio_file, session_id, language):
        # Implement OpenAI API call
        pass
    
    async def health_check(self):
        # Implement health check
        pass
```

2. Register in `AIProviderFactory`:

```python
# In ai_provider.py
elif provider_type == AIProviderType.OPENAI:
    from .openai_provider import OpenAIProvider
    cls._providers[provider_type] = OpenAIProvider()
```

3. Switch provider via API (debug mode only):

```http
GET /provider/openai
```

## Troubleshooting

### n8n Connection Issues

If you see "n8n_connected: false" in health check:

1. Verify n8n is running: `http://localhost:5678`
2. Check webhook URL in `.env`
3. Test webhook manually with curl:

```bash
curl -X POST http://localhost:5678/webhook/earthworm \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "session_id": "test123", "language": "en"}'
```

### CORS Errors

Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://your-domain.com
```

## License

MIT License - Part of the Earthworm Project
