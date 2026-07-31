import os
import re
import time
import uuid
import torch
import shutil
import asyncio
import hashlib
import numpy as np
from typing import Optional, List

def chunk_text(text: str, max_chars: int = 250) -> List[str]:
    # Supprimer les balises de modulation comme [chuchoté], [joyeux], etc.
    clean = re.sub(r'\[.*?\]', '', text).strip()
    clean = re.sub(r'\s+', ' ', clean)
    
    if not clean:
        return []

    # Découper selon la ponctuation forte (. ! ?) en préservant la ponctuation
    sentences = re.split(r'(?<=[.!?])\s+', clean)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        s = sentence.strip()
        if not s:
            continue
        if len(current_chunk) + len(s) + 1 <= max_chars:
            current_chunk = f"{current_chunk} {s}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = s

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [clean]
# Optimisation critique pour VPS KVM2 (2 vCPUs) : évite l'explosion de threads et la saturation CPU
torch.set_num_threads(2)
torch.set_num_interop_threads(2)
import urllib.request
import soundfile as sf
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from qwen_tts import Qwen3TTSModel

app = FastAPI(
    title="Calmi Private TTS Service",
    description="Microservice privé d'inférence TTS avec clonage de voix zero-shot propulsé par Qwen3-TTS et qwen-tts",
    version="1.1.0"
)

# Configuration de la sécurité API Key
API_KEY = os.getenv("TTS_API_KEY", "calmi_secure_token_change_me")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key_header: str = Depends(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Clé API non autorisée ou invalide")

# Définition des dossiers temporaires et de cache
TEMP_DIR = "/app/temp"
VOICES_CACHE_DIR = os.path.join(TEMP_DIR, "voices_cache")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(VOICES_CACHE_DIR, exist_ok=True)

# Lock global de sérialisation pour éviter la saturation CPU du VPS
generation_lock = asyncio.Lock()

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

def get_cached_voice_path(url: str) -> str:
    # Génère un chemin de fichier local stable basé sur le hash de l'URL
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    # Tenter d'extraire l'extension d'origine (.wav, .mp3, etc.)
    ext = url.split('?')[0].split('.')[-1].lower()
    if len(ext) > 4 or not ext.isalnum():
        ext = 'wav'
    return os.path.join(VOICES_CACHE_DIR, f"voice_{url_hash}.{ext}")

# Classes de requêtes pour l'API
class TTSRequest(BaseModel):
    text: str
    voice_ref_url: Optional[str] = None  # URL du fichier .wav de référence (optionnel)
    ref_text: Optional[str] = None  # Transcription optionnelle du fichier de référence
    language: str = "fr"  # Code de la langue (ex: "fr", "en")

class SegmentRequest(BaseModel):
    text: str
    voice_ref_url: Optional[str] = None
    ref_text: Optional[str] = None
    language: str = "fr"

class MultiVoiceRequest(BaseModel):
    segments: List[SegmentRequest]
    story_id: str
    speaker_change_pause_ms: int = 500
    same_speaker_pause_ms: int = 250

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": "cpu",
        "model": MODEL_NAME,
        "framework": "qwen-tts",
        "queue_locked": generation_lock.locked()
    }

@app.post("/synthesize", dependencies=[Depends(get_api_key)])
async def synthesize_speech(request: TTSRequest):
    req_id = str(uuid.uuid4())[:8]
    print(f"🎙️ [{req_id}] Requête de synthèse vocale simple reçue.")
    print(f"📝 [{req_id}] Chars: {len(request.text)} | Langue: {request.language}")

    ref_audio_path = os.path.join(TEMP_DIR, f"{req_id}_ref.wav")
    output_audio_path = os.path.join(TEMP_DIR, f"{req_id}_out.wav")

    try:
        # 1. Télécharger l'audio de référence ou utiliser le fichier local de secours
        DEFAULT_LOCAL_REF = os.path.join(os.path.dirname(__file__), "default_ref.wav")
        if request.voice_ref_url and request.voice_ref_url.strip():
            target_ref_url = request.voice_ref_url.strip()
            print(f"📥 [{req_id}] Téléchargement de la voix de référence depuis : {target_ref_url}")
            try:
                opener = urllib.request.build_opener()
                opener.addheaders = [('User-Agent', 'Calmi-TTS-Microservice')]
                urllib.request.install_opener(opener)
                urllib.request.urlretrieve(target_ref_url, ref_audio_path)
                print(f"✅ [{req_id}] Téléchargement de l'audio de référence réussi.")
            except Exception as dl_error:
                print(f"⚠️ [{req_id}] Échec du téléchargement ({dl_error}), utilisation du fichier local de secours...")
                if os.path.exists(DEFAULT_LOCAL_REF):
                    shutil.copyfile(DEFAULT_LOCAL_REF, ref_audio_path)
                else:
                    raise HTTPException(status_code=400, detail=f"Échec du téléchargement de la voix : {dl_error}")
        else:
            print(f"🎙️ [{req_id}] Aucune URL de voix spécifiée, utilisation de la voix par défaut.")
            if os.path.exists(DEFAULT_LOCAL_REF):
                shutil.copyfile(DEFAULT_LOCAL_REF, ref_audio_path)
            else:
                raise HTTPException(status_code=400, detail="Fichier local de référence manquant.")

        # 2. Préparer les paramètres de langue
        prompt_text = request.ref_text if request.ref_text else ""
        lang_map = {
            "fr": "French", "en": "English", "de": "German",
            "es": "Spanish", "it": "Italian", "zh": "Chinese",
            "ja": "Japanese", "ko": "Korean"
        }
        tts_lang = lang_map.get(request.language.lower(), "French")

        # 3. Découpage du texte long en segments naturels
        text_chunks = chunk_text(request.text, max_chars=250)
        print(f"🧩 [{req_id}] Découpage du texte complet ({len(request.text)} chars) en {len(text_chunks)} segments (Max 250 chars/chunk)...")

        # 4. Lancement de la génération vocale sous verrou de sérialisation
        async with generation_lock:
            print(f"⚡ [{req_id}] Inférence CPU Qwen3-TTS séquentielle en cours (sous verrou)...")
            start_inference = time.time()
            
            generated_wavs = []
            sr = 24000  # Frequence d'échantillonnage par défaut
            
            for idx, chunk in enumerate(text_chunks):
                print(f"   🗣️ [{req_id}] Synthèse segment {idx+1}/{len(text_chunks)} ({len(chunk)} chars)...")
                start_chunk_time = time.time()
                
                wavs, current_sr = model.generate_voice_clone(
                    text=chunk,
                    language=tts_lang,
                    ref_audio=ref_audio_path,
                    ref_text=prompt_text
                )
                sr = current_sr
                
                # Ajouter un silence naturel (250ms) entre les phrases
                if idx > 0:
                    pause_samples = int(sr * 0.25)
                    silence = np.zeros(pause_samples, dtype=np.float32)
                    generated_wavs.append(silence)
                
                generated_wavs.append(wavs[0])
                print(f"   ✅ [{req_id}] Segment {idx+1}/{len(text_chunks)} généré en {time.time() - start_chunk_time:.2f}s")
            
            # Concaténer tous les tableaux audio NumPy en un seul fichier audio binaire
            final_wav = np.concatenate(generated_wavs)
            
            # Sauvegarder le fichier audio de sortie complet
            sf.write(output_audio_path, final_wav, sr)
            inference_time = time.time() - start_inference
            print(f"🎉 [{req_id}] Synthèse intégrale réussie ({len(text_chunks)} segments concaténés) en {inference_time:.2f}s !")

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
        # Nettoyage
        if os.path.exists(ref_audio_path):
            try:
                os.remove(ref_audio_path)
            except Exception:
                pass

@app.post("/synthesize-multivoice", dependencies=[Depends(get_api_key)])
async def synthesize_multi_voice(request: MultiVoiceRequest):
    req_id = str(uuid.uuid4())[:8]
    print(f"🎙️ [{req_id}] Requête multi-voix reçue pour l'histoire {request.story_id} ({len(request.segments)} segments).")
    
    if not request.segments:
        raise HTTPException(status_code=400, detail="La liste des segments est vide.")
        
    output_audio_path = os.path.join(TEMP_DIR, f"{req_id}_multivoice_out.wav")
    
    try:
        # 1. Téléchargement préalable de toutes les voix de référence nécessaires (hors du lock CPU)
        ref_paths = {}
        for idx, segment in enumerate(request.segments):
            url = segment.voice_ref_url
            if url not in ref_paths:
                cached_path = get_cached_voice_path(url)
                if os.path.exists(cached_path):
                    print(f"💾 [{req_id}] Voix de référence trouvée dans le cache pour : {url}")
                    ref_paths[url] = cached_path
                else:
                    print(f"📥 [{req_id}] Téléchargement de la voix de référence : {url}")
                    try:
                        opener = urllib.request.build_opener()
                        opener.addheaders = [('User-Agent', 'Calmi-TTS-Microservice')]
                        urllib.request.install_opener(opener)
                        urllib.request.urlretrieve(url, cached_path)
                        ref_paths[url] = cached_path
                        print(f"✅ [{req_id}] Téléchargement réussi et mis en cache.")
                    except Exception as dl_error:
                        raise HTTPException(status_code=400, detail=f"Échec du téléchargement de la voix de référence {url} : {dl_error}")

        # 2. Inférence séquentielle des segments (sous verrou CPU pour éviter la saturation)
        generated_wavs = []
        sr = 24000  # sample rate par défaut
        previous_voice = None
        
        async with generation_lock:
            print(f"⚡ [{req_id}] Début de la synthèse multi-voix en batch (sous verrou CPU)...")
            
            for idx, segment in enumerate(request.segments):
                print(f"   🗣️ [{req_id}] Segment {idx+1}/{len(request.segments)} ({len(segment.text)} chars)")
                
                # Mappage de la langue
                lang_map = {
                    "fr": "French", "en": "English", "de": "German",
                    "es": "Spanish", "it": "Italian", "zh": "Chinese",
                    "ja": "Japanese", "ko": "Korean"
                }
                tts_lang = lang_map.get(segment.language.lower(), "French")
                ref_path = ref_paths[segment.voice_ref_url]
                prompt_text = segment.ref_text if segment.ref_text else ""
                
                # Inférence pour le segment
                start_inf = time.time()
                wavs, current_sr = model.generate_voice_clone(
                    text=segment.text,
                    language=tts_lang,
                    ref_audio=ref_path,
                    ref_text=prompt_text
                )
                print(f"   ✅ [{req_id}] Généré en {time.time() - start_inf:.2f}s (SR: {current_sr})")
                
                sr = current_sr
                segment_wav = wavs[0]
                
                # Ajouter un silence de pause avant le segment si ce n'est pas le premier
                if idx > 0:
                    is_same_speaker = (segment.voice_ref_url == previous_voice)
                    pause_ms = request.same_speaker_pause_ms if is_same_speaker else request.speaker_change_pause_ms
                    pause_samples = int(sr * (pause_ms / 1000.0))
                    if pause_samples > 0:
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)
                
                generated_wavs.append(segment_wav)
                previous_voice = segment.voice_ref_url
        
        # Concaténer tous les signaux
        print(f"🔗 [{req_id}] Concaténation de tous les segments...")
        combined_wav = np.concatenate(generated_wavs)
        
        # Sauvegarder le fichier audio complet
        sf.write(output_audio_path, combined_wav, sr)
        print(f"🎉 [{req_id}] Livre audio multi-voix assemblé avec succès !")
        
        return FileResponse(
            output_audio_path,
            media_type="audio/wav",
            filename=f"calmi_multivoice_{request.story_id}.wav"
        )
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"💥 [{req_id}] Erreur critique synthèse multi-voix : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne synthèse multi-voix : {str(e)}")
