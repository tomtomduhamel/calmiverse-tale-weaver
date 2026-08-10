import requests
import time

url = "http://31.97.40.49:8085/synthesize"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "thomas_calmi_tts_secure_token_2026"
}
payload = {
    "text": "Bonjour mon chéri, ceci est un test de synthèse.",
    "voice_ref_url": "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/voice-clones/59d2c73c-673c-4022-8f0e-a74d23975560/3788ec01-c177-45ff-a893-ec194bb560bf.webm",
    "ref_text": "Coucou mon chéri, installe-toi bien chaudement.",
    "language": "French"
}

print("[TEST] Envoi de la requête au VPS...")
start = time.time()
try:
    res = requests.post(url, json=payload, headers=headers, timeout=60)
    print(f"Status HTTP: {res.status_code} in {time.time() - start:.2f}s")
    if res.status_code == 200:
        print(f"Success! Received {len(res.content)} bytes.")
    else:
        print(f"Error: {res.text}")
except Exception as e:
    print(f"Exception: {e}")
