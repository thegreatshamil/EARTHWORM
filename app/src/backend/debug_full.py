"""
Full end-to-end debug: simulates exactly what n8n_bridge.py does
"""
import httpx
import asyncio
import json
import sys
import traceback

async def main():
    webhook_url = "http://localhost:5678/webhook/earthworm"
    timeout = 60.0

    text = "Hello"
    session_id = "debug2"
    language = "en"
    processed_image = None
    cleaned_audio = None

    lang_map = {
        "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
        "kn": "Kannada", "ml": "Malayalam", "bn": "Bengali",
        "mr": "Marathi", "gu": "Gujarati", "pa": "Punjabi"
    }
    lang_name = lang_map.get(language, "English")

    identity_prefix = "Your name is Varun, a helpful AI Agricultural Assistant. "
    prompt_text = f"{identity_prefix}{text}\n\n(Please respond ONLY in {lang_name})"

    common_data = {
        "text": prompt_text,
        "session_id": session_id,
        "language": language,
        "image_base64": processed_image,
        "audio_file": "true" if cleaned_audio else None,
        "has_image": "true" if processed_image else "false",
        "has_audio": "true" if cleaned_audio else "false",
    }

    body_data = {
        "text": prompt_text,
        "session_id": session_id,
        "language": language,
        "image_base64": processed_image,
        "audio_file": "true" if cleaned_audio else None,
    }

    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    payload = {**common_data, "body": body_data}

    print("Sending request (mimicking n8n_bridge.py exactly)...")
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(webhook_url, json=payload, headers=headers)
            print(f"n8n status: {response.status_code}")
            print(f"n8n raw body: {response.text[:500]}")
            print()

            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"Response type: {type(data)}")
                    print(f"Response keys: {list(data[0].keys()) if isinstance(data, list) and len(data) > 0 else (list(data.keys()) if isinstance(data, dict) else 'N/A')}")

                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]

                    if isinstance(data, str):
                        result = data
                    elif isinstance(data, dict):
                        result = (
                            data.get("response")
                            or data.get("assistant_reply")
                            or data.get("message")
                            or data.get("text")
                            or data.get("output")
                            or json.dumps(data)
                        )
                    else:
                        result = str(data)

                    print(f"\n✅ Parsed result: {result[:200]}")
                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error: {e}")
                    print(f"Raw text: {response.text}")
            else:
                print(f"❌ n8n returned status {response.status_code}")

    except Exception as e:
        print(f"❌ Exception: {type(e).__name__}: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
