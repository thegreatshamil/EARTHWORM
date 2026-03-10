import httpx
import asyncio
import json

async def main():
    try:
        url = "http://localhost:8000/chat"
        payload = {
            "text": "test",
            "session_id": "test_session",
            "language": "en"
        }
        print(f"Sending request to {url}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
