import sys
import time
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

MODAL_URL = "https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run"
WEBHOOK_ID = "acf83b01-258b-4a09-a3c2-d82909b7a7e1"
STORY_ID = "946051c3-31d5-4101-a134-2927abe5bf1f"
VOICE_ID = "b93c7425-7b62-4bc6-9356-1870140560a9"
PAPA_VOICE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/voice-clones/59d2c73c-673c-4022-8f0e-a74d23975560/b93c7425-7b62-4bc6-9356-1870140560a9.webm"
PAPA_REF_TEXT = "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles..."

with open("vps-tts-service/story_1.txt", "r", encoding="utf-8") as f:
    text = f.read()

payload = {
    "text": text,
    "language": "fr",
    "voice_ref_url": PAPA_VOICE_URL,
    "ref_text": PAPA_REF_TEXT,
    "instruct": "Warm, soothing bedtime narrator for children",
    "sentence_pause_ms": 250,
    "paragraph_pause_ms": 1000,
    "chapter_pause_ms": 3000,
    "enable_sleep_pacing": True,
    "webhook_id": WEBHOOK_ID,
    "story_id": STORY_ID,
    "voiceId": VOICE_ID
}

print(f"[TEST] Envoi de la requete de synthese au Fast-Gateway ({len(text)} chars)...")
t0 = time.time()
res = requests.post(MODAL_URL, json=payload, timeout=30)
t_response = time.time() - t0
print(f"[OK] Reponse en {t_response:.3f}s: HTTP {res.status_code}")
print(res.text)
