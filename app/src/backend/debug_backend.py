import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        url = "http://localhost:8000/chat"
        payload = {
            "text": "Hello",
            "session_id": "debug_session_2",
            "language": "en"
        }
        print("Sending to FastAPI backend /chat...")
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:1000]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
