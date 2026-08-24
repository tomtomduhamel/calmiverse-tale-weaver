import os
import io
import re
import time
import shutil
import uuid
import hashlib
import urllib.request
import subprocess
import numpy as np
import soundfile as sf
from typing import Optional, List, Tuple
from pydantic import BaseModel
import modal

# 1. Image Docker Modal avec FFmpeg pour la conversion webm -> wav
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("sox", "libsox-fmt-all", "ffmpeg", "libsndfile1", "git")
    .pip_install(
        "torch>=2.1.0",
        "torchaudio",
        "transformers>=4.38.0",
        "accelerate",
        "soundfile",
        "pydantic",
        "fastapi",
        "qwen-tts",
        "requests"
    )
    .add_local_file(
        "vps-tts-service/default_ref.wav",
        remote_path="/root/default_ref.wav",
        copy=True
    )
)

volume = modal.Volume.from_name("calmi-tts-cache", create_if_missing=True)
app = modal.App("calmi-tts-service")

def download_model_weights():
    import torch
    from qwen_tts import Qwen3TTSModel
    os.environ["HF_HOME"] = "/cache/huggingface"
    Qwen3TTSModel.from_pretrained(
        "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
        device_map="cpu",
        dtype=torch.float32
    )

image = image.run_function(
    download_model_weights,
    volumes={"/cache": volume}
)

EMOTION_MAP = {
    "warm": "Warm, soothing, gentle bedtime narrator for children.",
    "whisper": "Soft, gentle whispering voice, quiet bedtime narrator.",
    "excited": "Enthusiastic, cheerful, joyful storytelling voice for children.",
    "mysterious": "Curious, gentle, mysterious bedtime storytelling voice.",
    "calm": "Calm, peaceful, relaxed storytelling voice.",
    "sleepy": "Very slow, soft, sleepy bedtime voice."
}

def convert_to_wav(input_path: str, output_path: str) -> str:
    """Convertit n'importe quel fichier audio (webm, mp3, etc.) en WAV PCM 24kHz mono pour Qwen3-TTS"""
    try:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except Exception as e:
        print(f"⚠️ Erreur conversion FFmpeg ({e}), conservation du fichier d'origine")
        return input_path

def download_and_cache_voice(voice_url: str) -> str:
    """Télécharge et met en cache l'extrait vocal dans le Volume Modal"""
    if "user-voices" in voice_url:
        voice_url = voice_url.replace("user-voices", "voice-clones")

    cache_dir = "/cache/voices_cache"
    os.makedirs(cache_dir, exist_ok=True)
    
    url_hash = hashlib.md5(voice_url.encode('utf-8')).hexdigest()
    cached_wav_path = os.path.join(cache_dir, f"voice_{url_hash}.wav")
    
    if os.path.exists(cached_wav_path) and os.path.getsize(cached_wav_path) > 0:
        print(f"✅ Voix de référence trouvée en cache : {cached_wav_path}")
        return cached_wav_path

    temp_dl_path = os.path.join("/tmp", f"dl_{url_hash}")
    print(f"📥 Téléchargement de la voix de référence : {voice_url}")
    
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-Agent', 'Calmi-TTS-Service')]
    urllib.request.install_opener(opener)
    urllib.request.urlretrieve(voice_url, temp_dl_path)
    
    convert_to_wav(temp_dl_path, cached_wav_path)
    if os.path.exists(temp_dl_path):
        os.remove(temp_dl_path)
        
    print(f"✅ Voix convertie et mise en cache avec succès : {cached_wav_path}")
    return cached_wav_path

def chunk_text_optimized(
    text: str, 
    max_chars: int = 1000,
    paragraph_pause_sec: float = 1.0,
    default_instruct: Optional[str] = None
) -> List[Tuple[str, float, Optional[str]]]:
    """
    Découpe le texte en blocs fluides tout en extrayant les balises d'émotion [warm], [whisper], etc.
    L'émotion module l'expression SANS altérer l'identité vocale du narrateur.
    """
    if not text or not text.strip():
        return []

    raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]
    
    chunks_with_pauses = []
    current_block = ""
    is_first_block = True
    current_instruct = default_instruct

    tag_pattern = r'^\s*\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]'

    for idx, para in enumerate(paragraphs):
        match_tag = re.search(tag_pattern, para, re.IGNORECASE)
        if match_tag:
            tag_val = match_tag.group(1).strip()
            if tag_val.lower().startswith("instruct:"):
                current_instruct = tag_val[len("instruct:"):].strip()
            else:
                current_instruct = EMOTION_MAP.get(tag_val.lower(), default_instruct)

        para_clean = re.sub(r'\[.*?\]', '', para).strip()
        para_clean = re.sub(r'\s+', ' ', para_clean)
        
        if not para_clean:
            continue
            
        if len(current_block) + len(para_clean) + 2 > max_chars and current_block:
            pause = 0.0 if is_first_block else paragraph_pause_sec
            chunks_with_pauses.append((current_block, pause, current_instruct))
            is_first_block = False
            current_block = para_clean
        else:
            if current_block:
                current_block = f"{current_block}\n\n{para_clean}"
            else:
                current_block = para_clean

    if current_block:
        pause = 0.0 if is_first_block else paragraph_pause_sec
        chunks_with_pauses.append((current_block, pause, current_instruct))

    return chunks_with_pauses

class TTSRequest(BaseModel):
    text: str
    voice_ref_url: Optional[str] = None
    ref_text: Optional[str] = None
    instruct: Optional[str] = None
    language: str = "fr"
    sentence_pause_ms: Optional[int] = 250
    paragraph_pause_ms: Optional[int] = 1000
    chapter_pause_ms: Optional[int] = 3000
    enable_sleep_pacing: Optional[bool] = True
    webhook_id: Optional[str] = None
    story_id: Optional[str] = None
    # Aliases for frontend compatibility
    requestId: Optional[str] = None
    storyId: Optional[str] = None
    voiceId: Optional[str] = None
    isCustomVoice: Optional[bool] = None
    provider: Optional[str] = None
    allUserVoices: Optional[list] = None

@app.cls(
    gpu="L4",
    image=image,
    volumes={"/cache": volume},
    timeout=1800,
    scaledown_window=5,
)
class CalmiTTSGPU:
    @modal.enter()
    def setup(self):
        import torch
        from qwen_tts import Qwen3TTSModel
        
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.backends.cuda.enable_flash_sdp(True)
        torch.backends.cuda.enable_mem_efficient_sdp(True)
        
        print("⚡ Chargement de Qwen3-TTS sur GPU NVIDIA L4...")
        start = time.time()
        os.environ["HF_HOME"] = "/cache/huggingface"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.model = Qwen3TTSModel.from_pretrained(
            "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
            device_map=self.device,
            dtype=torch.float32
        )
        print(f"✅ Modèle prêt sur {self.device.upper()} en {time.time() - start:.2f}s !")

    def _process_synthesis(self, request: TTSRequest, req_id: str) -> Tuple[bytes, int]:
        import torch
        import numpy as np
        import soundfile as sf

        # 1. Résolution dynamique de la voix de référence
        DEFAULT_LOCAL_REF = "/root/default_ref.wav"
        if request.voice_ref_url and request.voice_ref_url.strip():
            try:
                ref_audio_path = download_and_cache_voice(request.voice_ref_url.strip())
            except Exception as e:
                print(f"⚠️ Erreur téléchargement voix ({e}), fallback sur voix par défaut.")
                ref_audio_path = DEFAULT_LOCAL_REF if os.path.exists(DEFAULT_LOCAL_REF) else None
        else:
            ref_audio_path = DEFAULT_LOCAL_REF if os.path.exists(DEFAULT_LOCAL_REF) else None

        paragraph_pause_sec = request.paragraph_pause_ms / 1000.0 if request.paragraph_pause_ms is not None else 1.0
        global_instruct = request.instruct.strip() if request.instruct and request.instruct.strip() else None

        text_chunks = chunk_text_optimized(
            request.text, 
            max_chars=1000,
            paragraph_pause_sec=paragraph_pause_sec,
            default_instruct=global_instruct
        )

        lang_map = {
            "fr": "French", "en": "English", "de": "German",
            "es": "Spanish", "it": "Italian", "zh": "Chinese",
            "ja": "Japanese", "ko": "Korean"
        }
        tts_lang = lang_map.get(request.language.lower(), "French")
        clean_prompt = request.ref_text.strip() if request.ref_text else ""

        print(f"⚡ [{req_id}] Synthèse vocale de la voix de référence ({ref_audio_path}) sur {len(text_chunks)} blocs...")
        start_inf = time.time()
        generated_wavs = []
        sr = 24000

        with torch.inference_mode():
            for idx, chunk_data in enumerate(text_chunks):
                chunk, pause_before, chunk_instruct = chunk_data
                t0 = time.time()
                
                clone_kwargs = {
                    "text": chunk,
                    "language": tts_lang,
                }
                if ref_audio_path and os.path.exists(ref_audio_path):
                    clone_kwargs["ref_audio"] = ref_audio_path

                # VERROUILLAGE L'EMPREINTE VOCALE : ref_text garantit la même identité vocale
                if clean_prompt:
                    clone_kwargs["ref_text"] = clean_prompt
                    clone_kwargs["x_vector_only_mode"] = False
                else:
                    clone_kwargs["x_vector_only_mode"] = True

                if chunk_instruct:
                    clone_kwargs["instruct"] = chunk_instruct

                wavs, current_sr = self.model.generate_voice_clone(**clone_kwargs)
                sr = current_sr
                
                # Insertion GRATUITE des silences sur CPU
                if pause_before > 0:
                    pause_samples = int(sr * pause_before)
                    silence = np.zeros(pause_samples, dtype=np.float32)
                    generated_wavs.append(silence)
                
                generated_wavs.append(wavs[0])
                print(f"  ├─ Bloc {idx+1}/{len(text_chunks)} ({len(chunk)} chars) généré en {time.time() - t0:.2f}s")

        final_wav = np.concatenate(generated_wavs)
        total_time = time.time() - start_inf
        print(f"🎉 [{req_id}] Synthèse GPU terminée en {total_time:.2f}s !")

        out_buf = io.BytesIO()
        sf.write(out_buf, final_wav, sr, format='WAV')
        out_buf.seek(0)
        return out_buf.getvalue(), sr

    @modal.fastapi_endpoint(method="POST")
    def synthesize(self, request: TTSRequest):
        from fastapi.responses import Response
        req_id = str(uuid.uuid4())[:8]
        print(f"🎙️ [{req_id}] Requête GPU reçue (Synchrone). Chars: {len(request.text)}")
        wav_bytes, sr = self._process_synthesis(request, req_id)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=calmi_gpu_{req_id}.wav"}
        )

    @modal.fastapi_endpoint(method="POST")
    def synthesize_async(self, request: TTSRequest):
        from fastapi.responses import JSONResponse
        req_id = str(uuid.uuid4())[:8]
        effective_webhook_id = request.webhook_id or request.requestId
        effective_story_id = request.story_id or request.storyId
        print(f"🚀 [{req_id}] Requête GPU reçue (Asynchrone). Webhook ID: {effective_webhook_id}, Story ID: {effective_story_id}")
        
        if not effective_webhook_id:
            return JSONResponse(status_code=400, content={"error": "webhook_id ou requestId est obligatoire pour le mode asynchrone"})

        req_dict = request.model_dump()
        req_dict["webhook_id"] = effective_webhook_id
        req_dict["story_id"] = effective_story_id
        self.process_async_task.spawn(req_dict, req_id)

        return JSONResponse(
            status_code=202,
            content={
                "status": "accepted",
                "message": "Génération audio lancée sur GPU en arrière-plan.",
                "request_id": req_id,
                "webhook_id": effective_webhook_id
            }
        )

    @modal.method()
    def process_async_task(self, request_dict: dict, req_id: str):
        import requests
        request = TTSRequest(**request_dict)
        print(f"⚙️ [{req_id}] Début du traitement asynchrone GPU...")
        wav_bytes, sr = self._process_synthesis(request, req_id)
        
        SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
        WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="

        target_story_id = request.story_id or request.storyId
        target_webhook_id = request.webhook_id or request.requestId
        target_voice_id = request.voiceId or "custom"

        print(f"📤 [{req_id}] Téléversement de l'audio vers Supabase (storyId: {target_story_id}, requestId: {target_webhook_id})...")
        files = {"audioFile": (f"{target_webhook_id}.wav", wav_bytes, "audio/wav")}
        data = {
            "requestId": target_webhook_id,
            "storyId": target_story_id,
            "voiceId": target_voice_id
        }
        headers = {"x-webhook-secret": WEBHOOK_SECRET}

        try:
            res = requests.post(SUPABASE_UPLOAD_URL, files=files, data=data, headers=headers, timeout=120)
            if res.status_code in [200, 201]:
                print(f"🎉 [{req_id}] Succès ! L'audio de l'histoire est en ligne et READY dans Calmi !")
            else:
                print(f"❌ [{req_id}] Erreur d'upload Supabase: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"💥 [{req_id}] Exception lors de l'upload Supabase: {e}")
