import httpx
import asyncio

async def test_url(client, url, name):
    print(f"Testing {name}: {url}")
    try:
        payload = {
            "text": "test",
            "session_id": "test_session",
            "language": "en"
        }
        response = await client.post(url, json=payload, timeout=10.0)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        return response.status_code == 200
    except Exception as e:
        print(f"  Error: {e}")
        return False

async def main():
    async with httpx.AsyncClient() as client:
        # Test 1: Production hook
        await test_url(client, "http://localhost:5678/webhook/earthworm", "Production Webhook")
        
        # Test 2: Test hook
        await test_url(client, "http://localhost:5678/webhook-test/earthworm", "Test Webhook")

if __name__ == "__main__":
    asyncio.run(main())
