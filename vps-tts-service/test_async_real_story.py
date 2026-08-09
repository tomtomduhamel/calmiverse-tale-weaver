import time
import requests

MODAL_ASYNC_URL = "https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run"
WEBHOOK_ID = "0d52395c-e658-45d9-a995-3509acaeed08"
STORY_TITLE = "Le Parapluie Bleu"

# Informations de la voix "Voix de Narrateur (Papa)" enregistrée dans Supabase user_voices
PAPA_VOICE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/voice-clones/59d2c73c-673c-4022-8f0e-a74d23975560/b93c7425-7b62-4bc6-9356-1870140560a9.webm"
PAPA_REF_TEXT = "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles..."

with open("story_2.txt", "r", encoding="utf-8") as f:
    text = f.read()

print(f"[TEST ASYNC GPU] Lancement avec la voix PAPA pour \"{STORY_TITLE}\" ({len(text)} chars)...")
start_time = time.time()

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
    "story_id": "9d01b668-5861-4cf5-9a28-ba4106dd7cfb"
}

try:
    response = requests.post(MODAL_ASYNC_URL, json=payload, timeout=60)
    response_time = time.time() - start_time
    
    if response.status_code == 202:
        print(f"[OK 0.1s] Reponse HTTP {response.status_code} en {response_time:.3f}s !")
        print(f"  Payload serveur : {response.json()}")
        print("[WAIT] Le GPU Modal traite la voix PAPA en arriere-plan et enverra le fichier audio directement a Supabase !")
    else:
        print(f"❌ HTTP {response.status_code} - {response.text}")
except Exception as e:
    print(f"[EXCEPTION] {e}")
