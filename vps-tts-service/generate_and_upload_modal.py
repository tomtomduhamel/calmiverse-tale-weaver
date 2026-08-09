import time
import requests
import json
import concurrent.futures

MODAL_URL = "https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize.modal.run"
SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="

STORIES_TO_GENERATE = [
    {
        "title": "La Boite aux boutons perdus",
        "webhook_id": "11ffbfea-57cb-4d3b-a0c8-ae51bb09cc33",
        "text_file": "story_1.txt"
    },
    {
        "title": "Le Parapluie Bleu",
        "webhook_id": "0d52395c-e658-45d9-a995-3509acaeed08",
        "text_file": "story_2.txt"
    }
]

def process_story(story_info):
    title = story_info["title"]
    webhook_id = story_info["webhook_id"]
    text_path = story_info["text_file"]
    
    with open(text_path, "r", encoding="utf-8") as f:
        text = f.read()
        
    print(f"[START] Lancement de la generation GPU pour : \"{title}\" ({len(text)} chars)...")
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
    
    # 1. Génération audio sur Modal GPU
    try:
        response = requests.post(MODAL_URL, json=payload, timeout=600)
        synth_time = time.time() - start_time
        
        if response.status_code != 200:
            print(f"[ERROR GPU] \"{title}\" : HTTP {response.status_code} - {response.text}")
            return False
            
        audio_bytes = response.content
        print(f"[GPU OK] \"{title}\" genere en {synth_time:.2f}s ! Taille : {len(audio_bytes)/1024/1024:.2f} MB")
        
        # 2. Upload direct vers Supabase via upload-audio-from-n8n
        print(f"[UPLOAD] Envoi de l'audio a Supabase pour \"{title}\" (webhook_id: {webhook_id})...")
        files = {
            "file": (f"{webhook_id}.wav", audio_bytes, "audio/wav")
        }
        data = {
            "webhook_id": webhook_id
        }
        headers = {
            "x-webhook-secret": WEBHOOK_SECRET
        }
        
        upload_res = requests.post(SUPABASE_UPLOAD_URL, files=files, data=data, headers=headers, timeout=120)
        
        if upload_res.status_code in [200, 201]:
            total_time = time.time() - start_time
            print(f"[SUCCESS] \"{title}\" disponible et PRETE dans Calmi en {total_time:.2f}s !")
            return True
        else:
            print(f"[ERROR UPLOAD] \"{title}\" : HTTP {upload_res.status_code} - {upload_res.text}")
            return False
            
    except Exception as e:
        print(f"[EXCEPTION] \"{title}\" : {e}")
        return False

def main():
    print("=========================================================")
    print("[TEST] LANCEMENT DU TEST REEL : GENERATION SIMULTANEE DE 2 HISTOIRES (~10min)")
    print("=========================================================")
    
    start_global = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(process_story, STORIES_TO_GENERATE))
        
    total_duration = time.time() - start_global
    print("=========================================================")
    print(f"[DONE] FIN DU TEST : Les 2 histoires longues ont ete traitees en {total_duration:.2f}s (~{total_duration/60:.1f} minutes) !")
    print("=========================================================")

if __name__ == "__main__":
    main()
