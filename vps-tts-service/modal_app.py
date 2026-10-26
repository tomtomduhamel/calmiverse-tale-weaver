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

# 1. Image Docker Modal avec FFmpeg, CosyVoice 2 (Hi! PARIS EU) et Qwen3-TTS en secours
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
        "requests",
        "cosyvoice2-eu",
        "qwen-tts"
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
    os.environ["HF_HOME"] = "/cache/huggingface"
    # Pré-téléchargement et mise en cache du modèle CosyVoice 2 EU
    try:
        from cosyvoice2_eu import load
        load()
        print("✅ Poids CosyVoice2-EU pré-téléchargés et mis en cache dans le Volume Modal !")
    except Exception as e:
        print(f"⚠️ Échec pré-téléchargement CosyVoice2-EU ({e})")

    # Pré-téléchargement de secours pour Qwen3-TTS
    try:
        import torch
        from qwen_tts import Qwen3TTSModel
        Qwen3TTSModel.from_pretrained(
            "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
            device_map="cpu",
            dtype=torch.float32
        )
        print("✅ Poids Qwen3-TTS de secours pré-téléchargés !")
    except Exception as e:
        print(f"⚠️ Échec pré-téléchargement Qwen3-TTS ({e})")

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
    """Convertit n'importe quel fichier audio en WAV PCM 24kHz mono avec nettoyage spectral anti-bruit et de-essing"""
    try:
        # Filtre passe-haut 70Hz (anti-grondement), passe-bas 12kHz (anti-souffle aigu) et réducteur de bruit FFT
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-af", "highpass=f=70,lowpass=f=12000,afftdn=nf=-25",
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except Exception as e:
        print(f"⚠️ Erreur conversion FFmpeg ({e}), fallback simple...")
        try:
            cmd = ["ffmpeg", "-y", "-i", input_path, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", output_path]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return output_path
        except Exception:
            return input_path

def master_audio_bytes(input_wav_bytes: bytes, sr: int = 24000) -> bytes:
    """Applique un mastering broadcast EBU R128 (-16 LUFS) feutré pour les contes d'enfants"""
    import tempfile
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as in_f:
            in_f.write(input_wav_bytes)
            in_path = in_f.name
        out_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        
        # Normalisation EBU R128 -16 LUFS avec pic vrai à -1.5 dBTP
        cmd = [
            "ffmpeg", "-y", "-i", in_path,
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", str(sr), "-ac", "1", "-c:a", "pcm_s16le",
            out_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(out_path, "rb") as out_f:
            mastered_data = out_f.read()
        os.remove(in_path)
        os.remove(out_path)
        return mastered_data
    except Exception as e:
        print(f"⚠️ Erreur mastering audio ({e}), utilisation de l'audio direct")
        return input_wav_bytes

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

    converted_wav = convert_to_wav(temp_dl_path, cached_wav_path)
    if os.path.exists(temp_dl_path):
        os.remove(temp_dl_path)
        
    return converted_wav

def chunk_text_optimized(
    text: str, 
    max_chars: int = 1000,
    paragraph_pause_sec: float = 1.0,
    chapter_pause_sec: float = 3.0,
    default_instruct: Optional[str] = None,
    enable_sleep_pacing: bool = True
) -> List[Tuple[str, float, Optional[str]]]:
    """Découpe l'histoire avec gestion intelligente des pauses et émotions progressives (Sleep Pacing)"""
    if not text or not text.strip():
        return []

    raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]
    total_paras = len(paragraphs)
    
    chapter_pattern = r'^\s*(?:#+\s*|#*\s*(?:chapitre|partie|épisode|prologue|épilogue|introduction|conclusion)\b)'
    tag_pattern = r'^\s*\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]'

    current_instruct = default_instruct
    chunks_with_pauses = []

    for idx, para in enumerate(paragraphs):
        progress = (idx / float(total_paras - 1)) if total_paras > 1 else 0.0

        match_tag = re.search(tag_pattern, para, re.IGNORECASE)
        if match_tag:
            tag_val = match_tag.group(1).strip()
            if tag_val.lower().startswith("instruct:"):
                current_instruct = tag_val[len("instruct:"):].strip()
            else:
                current_instruct = EMOTION_MAP.get(tag_val.lower(), default_instruct)

        para_clean_for_detect = re.sub(r'\[.*?\]', '', para).strip()
        
        if idx == 0:
            pause_before = 0.0
        else:
            if re.match(chapter_pattern, para_clean_for_detect, re.IGNORECASE):
                pause_before = chapter_pause_sec
            else:
                if enable_sleep_pacing:
                    if progress < 0.33:
                        pause_before = paragraph_pause_sec
                    elif progress < 0.66:
                        pause_before = paragraph_pause_sec * 1.5
                    else:
                        pause_before = paragraph_pause_sec * 2.5
                else:
                    pause_before = paragraph_pause_sec

        final_chunk_instruct = current_instruct
        if enable_sleep_pacing and progress >= 0.66:
            sleep_suffix = ", very slow, soft, sleepy bedtime pace"
            if final_chunk_instruct:
                if sleep_suffix not in final_chunk_instruct:
                    final_chunk_instruct = final_chunk_instruct + sleep_suffix
            else:
                final_chunk_instruct = "Very slow, soft, sleepy bedtime voice"

        para_for_synth = re.sub(r'\[.*?\]', '', para).strip()
        para_for_synth = re.sub(r'\s+', ' ', para_for_synth)
        
        if not para_for_synth:
            continue
            
        chunks_with_pauses.append((para_for_synth, pause_before, final_chunk_instruct))

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
    isMultiVoice: Optional[bool] = None
    segments: Optional[list] = None
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
        
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.backends.cuda.enable_flash_sdp(True)
        torch.backends.cuda.enable_mem_efficient_sdp(True)
        
        os.environ["HF_HOME"] = "/cache/huggingface"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.engine = "cosyvoice2"

        # 1. Tentative de chargement du moteur principal : CosyVoice 2 EU
        print("⚡ [CalmiTTSGPU] Initialisation du moteur CosyVoice 2 (Hi! PARIS EU)...")
        start = time.time()
        try:
            from cosyvoice2_eu import load
            self.cosy_model = load()
            self.engine = "cosyvoice2"
            print(f"✅ [CalmiTTSGPU] CosyVoice 2 EU prêt sur {self.device.upper()} en {time.time() - start:.2f}s !")
        except Exception as e:
            print(f"⚠️ [CalmiTTSGPU] Impossible de charger CosyVoice 2 ({e}), bascule sur Qwen3-TTS...")
            from qwen_tts import Qwen3TTSModel
            self.qwen_model = Qwen3TTSModel.from_pretrained(
                "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
                device_map=self.device,
                dtype=torch.float32
            )
            self.engine = "qwen3"
            print(f"✅ [CalmiTTSGPU] Qwen3-TTS de secours prêt en {time.time() - start:.2f}s !")

    def _upload_to_supabase(self, wav_bytes: bytes, story_id: str, webhook_id: str, voice_id: str, req_id: str):
        import requests
        SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
        WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="

        files = {"audioFile": (f"{webhook_id}.wav", wav_bytes, "audio/wav")}
        data = {
            "requestId": webhook_id,
            "storyId": story_id,
            "voiceId": voice_id
        }
        headers = {"x-webhook-secret": WEBHOOK_SECRET}

        try:
            res = requests.post(SUPABASE_UPLOAD_URL, files=files, data=data, headers=headers, timeout=120)
            if res.status_code in [200, 201]:
                print(f"🎉 [{req_id}] Succès upload Supabase ({story_id}) !")
            else:
                print(f"❌ [{req_id}] Erreur d'upload Supabase: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"💥 [{req_id}] Exception lors de l'upload Supabase: {e}")

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

        print(f"⚡ [{req_id}] Synthèse vocale [{self.engine.upper()}] de la voix de référence ({ref_audio_path}) sur {len(text_chunks)} blocs...")
        start_inf = time.time()
        generated_wavs = []
        sr = 24000

        with torch.inference_mode():
            if request.isMultiVoice and request.segments and len(request.segments) > 0:
                print(f"🎭 [{req_id}] Théâtre Audio Multi-Voix détecté ({len(request.segments)} répliques/segments) !")
                previous_speaker = None
                for idx, seg in enumerate(request.segments):
                    seg_text = seg.get("text", "").strip()
                    if not seg_text:
                        continue

                    t0 = time.time()
                    seg_ref_url = seg.get("voiceRefUrl")
                    seg_speaker_key = seg_ref_url or seg.get("voiceId") or "narrator"

                    seg_ref_path = None
                    if seg_ref_url and seg_ref_url.strip():
                        try:
                            seg_ref_path = download_and_cache_voice(seg_ref_url.strip())
                        except Exception as e:
                            print(f"⚠️ Erreur chargement voix réplique {idx} ({e})")
                            seg_ref_path = ref_audio_path
                    else:
                        seg_ref_path = ref_audio_path or (DEFAULT_LOCAL_REF if os.path.exists(DEFAULT_LOCAL_REF) else None)

                    # Pause naturelle d'alternance interlocuteur
                    if idx == 0:
                        seg_pause = 0.0
                    elif seg_speaker_key == previous_speaker:
                        seg_pause = 0.25  # Même locuteur
                    else:
                        seg_pause = 0.50  # Changement d'interlocuteur

                    previous_speaker = seg_speaker_key

                    if self.engine == "cosyvoice2":
                        prompt_target = seg_ref_path if (seg_ref_path and os.path.exists(seg_ref_path)) else DEFAULT_LOCAL_REF
                        wav, current_sr = self.cosy_model.tts(
                            text=seg_text,
                            prompt=prompt_target
                        )
                        sr = current_sr
                        if hasattr(wav, 'cpu'):
                            wav_np = wav.cpu().numpy()
                        else:
                            wav_np = np.array(wav, dtype=np.float32)
                        if wav_np.ndim > 1:
                            wav_np = wav_np.squeeze()
                    else:
                        clone_kwargs = {
                            "text": seg_text,
                            "language": tts_lang,
                        }
                        if seg_ref_path and os.path.exists(seg_ref_path):
                            clone_kwargs["ref_audio"] = seg_ref_path
                            clone_kwargs["x_vector_only_mode"] = True
                        wavs, current_sr = self.qwen_model.generate_voice_clone(**clone_kwargs)
                        sr = current_sr
                        wav_np = wavs[0]

                    if seg_pause > 0:
                        pause_samples = int(sr * seg_pause)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    speaker_label = seg.get("speakerName") or seg.get("roleCategory") or "Narrateur"
                    print(f"  ├─ [Théâtre] Segment {idx+1}/{len(request.segments)} ({speaker_label}: {len(seg_text)} chars) généré en {time.time() - t0:.2f}s")

                    # FAST-PLAY THÉÂTRE : Téléversement du premier segment pour lecture instantanée
                    target_story_id = request.story_id or request.storyId
                    target_webhook_id = request.webhook_id or request.requestId
                    target_voice_id = request.voiceId or "multivoice"
                    if idx == 0 and len(request.segments) > 1 and target_story_id and target_webhook_id:
                        buf0 = io.BytesIO()
                        sf.write(buf0, wav_np, sr, format='WAV')
                        buf0.seek(0)
                        buf0_mastered = master_audio_bytes(buf0.getvalue(), sr)
                        print(f"⚡ [{req_id}] FAST-PLAY THÉÂTRE : Téléversement prioritaire du premier segment masterisé (-16 LUFS)...")
                        self._upload_to_supabase(buf0_mastered, target_story_id, target_webhook_id, target_voice_id, f"{req_id}_chunk0")

            elif self.engine == "cosyvoice2":
                # Inférence CosyVoice 2 (ultra-rapide, RTF ~0.2)
                for idx, chunk_data in enumerate(text_chunks):
                    chunk, pause_before, chunk_instruct = chunk_data
                    t0 = time.time()

                    prompt_target = ref_audio_path if (ref_audio_path and os.path.exists(ref_audio_path)) else DEFAULT_LOCAL_REF
                    wav, current_sr = self.cosy_model.tts(
                        text=chunk,
                        prompt=prompt_target
                    )
                    sr = current_sr

                    if hasattr(wav, 'cpu'):
                        wav_np = wav.cpu().numpy()
                    else:
                        wav_np = np.array(wav, dtype=np.float32)

                    if wav_np.ndim > 1:
                        wav_np = wav_np.squeeze()

                    # Insertion des silences sur CPU
                    if pause_before > 0:
                        pause_samples = int(sr * pause_before)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    print(f"  ├─ [CosyVoice2] Bloc {idx+1}/{len(text_chunks)} ({len(chunk)} chars) généré en {time.time() - t0:.2f}s")

                    # FAST-PLAY : Téléversement immédiat du bloc 1 pour débloquer l'écoute en < 4s
                    target_story_id = request.story_id or request.storyId
                    target_webhook_id = request.webhook_id or request.requestId
                    target_voice_id = request.voiceId or "custom"
                    if idx == 0 and len(text_chunks) > 1 and target_story_id and target_webhook_id:
                        buf0 = io.BytesIO()
                        sf.write(buf0, wav_np, sr, format='WAV')
                        buf0.seek(0)
                        buf0_mastered = master_audio_bytes(buf0.getvalue(), sr)
                        print(f"⚡ [{req_id}] FAST-PLAY GPU : Téléversement prioritaire du premier bloc masterisé (-16 LUFS)...")
                        self._upload_to_supabase(buf0_mastered, target_story_id, target_webhook_id, target_voice_id, f"{req_id}_chunk0")
            else:
                # Inférence Qwen3-TTS de secours
                for idx, chunk_data in enumerate(text_chunks):
                    chunk, pause_before, chunk_instruct = chunk_data
                    t0 = time.time()
                    
                    clone_kwargs = {
                        "text": chunk,
                        "language": tts_lang,
                    }
                    if ref_audio_path and os.path.exists(ref_audio_path):
                        clone_kwargs["ref_audio"] = ref_audio_path

                    if clean_prompt:
                        clone_kwargs["ref_text"] = clean_prompt
                        clone_kwargs["x_vector_only_mode"] = False
                    else:
                        clone_kwargs["x_vector_only_mode"] = True

                    if chunk_instruct:
                        clone_kwargs["instruct"] = chunk_instruct

                    wavs, current_sr = self.qwen_model.generate_voice_clone(**clone_kwargs)
                    sr = current_sr
                    
                    if pause_before > 0:
                        pause_samples = int(sr * pause_before)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)
                    
                    generated_wavs.append(wavs[0])
                    print(f"  ├─ [Qwen3] Bloc {idx+1}/{len(text_chunks)} ({len(chunk)} chars) généré en {time.time() - t0:.2f}s")

        final_wav = np.concatenate(generated_wavs)
        total_time = time.time() - start_inf
        print(f"🎉 [{req_id}] Synthèse GPU [{self.engine.upper()}] terminée en {total_time:.2f}s !")

        out_buf = io.BytesIO()
        sf.write(out_buf, final_wav, sr, format='WAV')
        out_buf.seek(0)
        
        # Mastering EBU R128 (-16 LUFS)
        mastered_audio = master_audio_bytes(out_buf.getvalue(), sr)
        return mastered_audio, sr

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
        
        target_story_id = request.story_id or request.storyId
        target_webhook_id = request.webhook_id or request.requestId
        target_voice_id = request.voiceId or "custom"

        print(f"📤 [{req_id}] Téléversement de l'audio complet vers Supabase (storyId: {target_story_id}, requestId: {target_webhook_id})...")
        self._upload_to_supabase(wav_bytes, target_story_id, target_webhook_id, target_voice_id, f"{req_id}_final")
