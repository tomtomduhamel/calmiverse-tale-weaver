import requests
import io
import soundfile as sf
import numpy as np

SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="
WEBHOOK_ID = "0d52395c-e658-45d9-a995-3509acaeed08"
STORY_ID = "9d01b668-5861-4cf5-9a28-ba4106dd7cfb"

# Génère 1 seconde de test audio
sr = 24000
test_audio = np.zeros(sr, dtype=np.float32)
buf = io.BytesIO()
sf.write(buf, test_audio, sr, format='WAV')
buf.seek(0)
wav_bytes = buf.getvalue()

print(f"[TEST UPLOAD] Test direct Supabase Edge Function avec requestId={WEBHOOK_ID}...")
files = {"audioFile": ("test.wav", wav_bytes, "audio/wav")}
data = {
    "requestId": WEBHOOK_ID,
    "storyId": STORY_ID
}
headers = {"x-webhook-secret": WEBHOOK_SECRET}

res = requests.post(SUPABASE_UPLOAD_URL, files=files, data=data, headers=headers, timeout=30)
print(f"Statut Supabase : {res.status_code}")
print(f"Réponse Supabase : {res.text}")
