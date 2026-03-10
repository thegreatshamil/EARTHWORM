import requests
import json

try:
    url = "http://localhost:8000/chat"
    payload = {
        "text": "test",
        "session_id": "test_session",
        "language": "en"
    }
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
