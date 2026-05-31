import os
import time
import uuid
import torch
import urllib.request
import soundfile as sf
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from transformers import AutoProcessor, AutoModelForCausalLM

app = FastAPI(
    title="Calmi Private TTS Service",
    description="Microservice privé d'inférence TTS avec clonage de voix zero-shot propulsé par Qwen3-TTS-0.6B",
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

# Chargement du modèle au démarrage (Qwen3-TTS-0.6B-Base)
MODEL_NAME = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"
print(f"📦 Chargement du modèle {MODEL_NAME} sur CPU...")
start_time = time.time()

try:
    processor = AutoProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float32,  # float32 pour CPU
        device_map="cpu",
        trust_remote_code=True
    )
    print(f"✅ Modèle chargé avec succès en {time.time() - start_time:.2f} secondes !")
except Exception as e:
    print(f"❌ Erreur lors du chargement du modèle : {e}")
    # En cas d'erreur de téléchargement initial, le conteneur continuera à démarrer,
    # mais lèvera des erreurs lors des requêtes.

class TTSRequest(BaseModel):
    text: str
    voice_ref_url: str  # URL publique ou signée du fichier .wav de référence (ex: Thomas)
    ref_text: Optional[str] = None  # Transcription optionnelle du fichier de référence pour améliorer le clonage
    language: str = "fr"  # Langue de synthèse (ex: "fr", "en")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": "cpu",
        "model": MODEL_NAME,
        "torch_version": torch.__version__
    }

@app.post("/synthesize", dependencies=[Depends(get_api_key)])
async def synthesize_speech(request: TTSRequest):
    req_id = str(uuid.uuid4())[:8]
    print(f"🎙️ [{req_id}] Requete de synthese vocale recue.")
    print(f"📝 [{req_id}] Chars: {len(request.text)} | Langue: {request.language}")

    ref_audio_path = os.path.join(TEMP_DIR, f"{req_id}_ref.wav")
    output_audio_path = os.path.join(TEMP_DIR, f"{req_id}_out.wav")

    try:
        # 1. Télécharger l'audio de référence
        print(f"📥 [{req_id}] Téléchargement du fichier de référence depuis : {request.voice_ref_url}")
        try:
            # Configurer un User-Agent pour éviter d'être bloqué
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-Agent', 'Calmi-TTS-Microservice')]
            urllib.request.install_opener(opener)
            urllib.request.urlretrieve(request.voice_ref_url, ref_audio_path)
            print(f"✅ [{req_id}] Téléchargement de l'audio de référence réussi.")
        except Exception as dl_error:
            raise HTTPException(status_code=400, detail=f"Échec du téléchargement du fichier audio de référence : {dl_error}")

        # 2. Charger le fichier de référence avec SoundFile
        try:
            ref_audio, sample_rate = sf.read(ref_audio_path)
            print(f"🎵 [{req_id}] Audio chargé. Sample Rate: {sample_rate}Hz | Échantillons: {len(ref_audio)}")
        except Exception as audio_error:
            raise HTTPException(status_code=400, detail=f"Fichier audio de référence corrompu ou illisible : {audio_error}")

        # 3. Préparer le prompt de clonage avec Qwen3-TTS
        print(f"🎛️ [{req_id}] Extraction de l'empreinte vocale (In-Context Prompting)...")
        # Si la transcription du prompt n'est pas fournie, Qwen peut déduire la prosodie
        # mais fournir ref_text augmente grandement la qualité
        prompt_text = request.ref_text if request.ref_text else ""
        
        # Inférence du modèle
        print(f"⚡ [{req_id}] Lancement de la génération vocale (Inférence CPU)...")
        start_inference = time.time()
        
        # Préparation des tenseurs d'entrée
        inputs = processor(
            text=request.text,
            ref_audio=ref_audio,
            ref_text=prompt_text,
            sampling_rate=sample_rate,
            language=request.language,
            return_tensors="pt"
        )
        
        # Génération
        with torch.no_grad():
            output_ids = model.generate(**inputs)
            
        # Conversion des IDs générés en audio Wave
        generated_audio = processor.batch_decode(output_ids, as_audio=True)[0]
        
        # Sauvegarder le fichier de sortie
        sf.write(output_audio_path, generated_audio, sample_rate)
        
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
        raise HTTPException(status_code=500, detail=f"Erreur interne du serveur de synthèse : {str(e)}")
        
    finally:
        # Nettoyage asynchrone des fichiers temporaires après envoi
        # Nous laissons FileResponse lire le fichier de sortie, mais nous pouvons
        # planifier un nettoyage régulier ou supprimer le fichier de référence immédiatement.
        if os.path.exists(ref_audio_path):
            try:
                os.remove(ref_audio_path)
            except Exception:
                pass
