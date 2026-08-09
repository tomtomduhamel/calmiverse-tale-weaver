import time
import requests

MODAL_URL = "https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize.modal.run"
SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="

WEBHOOK_ID = "0d52395c-e658-45d9-a995-3509acaeed08"
STORY_TITLE = "Le Parapluie Bleu"

with open("story_2.txt", "r", encoding="utf-8") as f:
    text = f.read()

print(f"[TEST] Lancement de la synthese GPU pour : \"{STORY_TITLE}\" ({len(text)} chars)...")
start_time = time.time()

payload = {
    "text": text,
    "language": "fr",
    "instruct": "Warm, gentle bedtime story narrator for children",
    "sentence_pause_ms": 250,
    "paragraph_pause_ms": 1000,
    "chapter_pause_ms": 3000,
    "enable_sleep_pacing": True
}

try:
    response = requests.post(MODAL_URL, json=payload, timeout=600)
    synth_time = time.time() - start_time
    
    if response.status_code == 200:
        audio_bytes = response.content
        mb_size = len(audio_bytes) / 1024 / 1024
        print(f"[SUCCESS GPU] \"{STORY_TITLE}\" genere en {synth_time:.2f} secondes ! (Taille : {mb_size:.2f} MB)")
        
        # Upload vers Supabase
        print(f"[UPLOAD] Envoi de l'audio a Supabase...")
        files = {"file": (f"{WEBHOOK_ID}.wav", audio_bytes, "audio/wav")}
        data = {"webhook_id": WEBHOOK_ID}
        headers = {"x-webhook-secret": WEBHOOK_SECRET}
        
        upload_res = requests.post(SUPABASE_UPLOAD_URL, files=files, data=data, headers=headers, timeout=120)
        if upload_res.status_code in [200, 201]:
            print(f"[SUCCESS UPLOAD] L'histoire est disponible et READY dans l'application Calmi !")
        else:
            print(f"[ERROR UPLOAD] HTTP {upload_res.status_code} - {upload_res.text}")
    else:
        print(f"[ERROR GPU] HTTP {response.status_code} - {response.text}")
except Exception as e:
    print(f"[EXCEPTION] : {e}")
