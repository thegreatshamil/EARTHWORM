import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        url = "http://localhost:5678/webhook/earthworm"
        payload = {
            "text": "Hello",
            "session_id": "debug_session",
            "language": "en",
            "has_image": "false",
            "has_audio": "false",
            "body": {
                "text": "Hello",
                "session_id": "debug_session",
                "language": "en"
            }
        }
        print("Sending directly to n8n...")
        response = await client.post(url, json=payload, timeout=30.0)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}")

if __name__ == "__main__":
    asyncio.run(main())
