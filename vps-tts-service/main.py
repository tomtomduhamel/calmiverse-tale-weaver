import os
import time
import uuid
import torch
# Optimisation critique pour VPS KVM2 (2 vCPUs) : évite l'explosion de threads et la saturation CPU
torch.set_num_threads(2)
torch.set_num_interop_threads(2)
import urllib.request
import soundfile as sf
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from qwen_tts import Qwen3TTSModel

app = FastAPI(
    title="Calmi Private TTS Service",
    description="Microservice privé d'inférence TTS avec clonage de voix zero-shot propulsé par Qwen3-TTS et qwen-tts",
    version="1.0.0"
)

# Configuration de la sécurité API Key
API_KEY = os.getenv("TTS_API_KEY", "calmi_secure_token_change_me")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key_header: str = Depends(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Clé API non autorisée ou invalide")

# Définition des dossiers temporaires
TEMP_DIR = "/app/temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Chargement du modèle au démarrage (Qwen3-TTS-12Hz-0.6B-Base)
MODEL_NAME = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"
print(f"📦 Chargement du modèle {MODEL_NAME} sur CPU via qwen-tts...")
start_time = time.time()

try:
    # Charger le modèle officiellement via le wrapper qwen-tts
    model = Qwen3TTSModel.from_pretrained(
        MODEL_NAME,
        device_map="cpu",
        dtype=torch.float32  # Utiliser float32 pour CPU
    )
    print(f"✅ Modèle chargé avec succès en {time.time() - start_time:.2f} secondes !")
except Exception as e:
    print(f"❌ Erreur lors du chargement du modèle : {e}")

class TTSRequest(BaseModel):
    text: str
    voice_ref_url: str  # URL du fichier .wav de référence (ex: Thomas)
    ref_text: Optional[str] = None  # Transcription optionnelle du fichier de référence
    language: str = "fr"  # Code de la langue (ex: "fr", "en")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": "cpu",
        "model": MODEL_NAME,
        "framework": "qwen-tts"
    }

@app.post("/synthesize", dependencies=[Depends(get_api_key)])
async def synthesize_speech(request: TTSRequest):
    req_id = str(uuid.uuid4())[:8]
    print(f"🎙️ [{req_id}] Requête de synthèse vocale reçue.")
    print(f"📝 [{req_id}] Chars: {len(request.text)} | Langue d'origine: {request.language}")

    ref_audio_path = os.path.join(TEMP_DIR, f"{req_id}_ref.wav")
    output_audio_path = os.path.join(TEMP_DIR, f"{req_id}_out.wav")

    try:
        # 1. Télécharger l'audio de référence
        print(f"📥 [{req_id}] Téléchargement du fichier de référence depuis : {request.voice_ref_url}")
        try:
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-Agent', 'Calmi-TTS-Microservice')]
            urllib.request.install_opener(opener)
            urllib.request.urlretrieve(request.voice_ref_url, ref_audio_path)
            print(f"✅ [{req_id}] Téléchargement de l'audio de référence réussi.")
        except Exception as dl_error:
            raise HTTPException(status_code=400, detail=f"Échec du téléchargement du fichier audio de référence : {dl_error}")

        # 2. Préparer les paramètres (transcription et langue)
        prompt_text = request.ref_text if request.ref_text else ""
        
        # Traduction des codes de langue en noms complets attendus par qwen-tts
        lang_map = {
            "fr": "French",
            "en": "English",
            "de": "German",
            "es": "Spanish",
            "it": "Italian",
            "zh": "Chinese",
            "ja": "Japanese",
            "ko": "Korean"
        }
        tts_lang = lang_map.get(request.language.lower(), "French")
        print(f"🗣️ [{req_id}] Langue de synthèse mappée : {tts_lang}")

        # 3. Lancement de la génération vocale (Inférence CPU via qwen-tts)
        print(f"⚡ [{req_id}] Inférence CPU Qwen3-TTS en cours...")
        start_inference = time.time()
        
        wavs, sr = model.generate_voice_clone(
            text=request.text,
            language=tts_lang,
            ref_audio=ref_audio_path,
            ref_text=prompt_text
        )
        
        # 4. Sauvegarder le fichier audio de sortie
        sf.write(output_audio_path, wavs[0], sr)
        
        inference_time = time.time() - start_inference
        print(f"🎉 [{req_id}] Synthèse réussie en {inference_time:.2f}s !")

        # Retourner le fichier généré
        return FileResponse(
            output_audio_path,
            media_type="audio/wav",
            filename=f"calmi_story_{req_id}.wav"
        )

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"💥 [{req_id}] Erreur système critique durant la synthèse : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne de synthèse : {str(e)}")
        
    finally:
        # Nettoyage asynchrone des fichiers temporaires après envoi
        if os.path.exists(ref_audio_path):
            try:
                os.remove(ref_audio_path)
            except Exception:
                pass
