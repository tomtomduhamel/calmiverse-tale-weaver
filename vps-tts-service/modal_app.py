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

# 1. Image Docker Modal avec FFmpeg et CosyVoice 2 (Hi! PARIS EU)
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("sox", "libsox-fmt-all", "ffmpeg", "libsndfile1", "git")
    .pip_install(
        "setuptools<70.0.0",
        "wheel",
        "torch==2.3.1",
        "torchaudio==2.3.1",
        "cosyvoice2-eu",
        "soundfile",
        "pydantic",
        "fastapi",
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
    os.environ["HF_HOME"] = "/cache/huggingface"
    # Pré-téléchargement et mise en cache du modèle CosyVoice 2 EU
    try:
        from cosyvoice2_eu import load
        load()
        print("✅ Poids CosyVoice2-EU pré-téléchargés et mis en cache dans le Volume Modal !")
    except Exception as e:
        print(f"⚠️ Échec pré-téléchargement CosyVoice2-EU ({e})")

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

def download_and_cache_voice(voice_url: str, voice_key: Optional[str] = None) -> str:
    """Télécharge et met en cache l'extrait vocal dans le Volume Modal de manière persistante"""
    if not voice_url:
        return "/root/default_ref.wav"

    if "user-voices" in voice_url:
        voice_url = voice_url.replace("user-voices", "voice-clones")

    cache_dir = "/cache/voices_cache"
    os.makedirs(cache_dir, exist_ok=True)
    
    # Extraire une clé propre et stable (sans token temporaire ni paramètres d'URL signée)
    clean_base = voice_url.split("?")[0]
    if voice_key and voice_key.strip():
        stable_key = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', voice_key.strip())
    else:
        file_part = clean_base.split("/")[-1]
        if file_part and len(file_part) > 3:
            stable_key = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file_part)
        else:
            stable_key = hashlib.md5(clean_base.encode('utf-8')).hexdigest()

    cached_wav_path = os.path.join(cache_dir, f"voice_{stable_key}.wav")
    
    if not (os.path.exists(cached_wav_path) and os.path.getsize(cached_wav_path) > 0):
        try:
            volume.reload()
        except Exception:
            pass

    if os.path.exists(cached_wav_path) and os.path.getsize(cached_wav_path) > 0:
        print(f"✅ Voix de référence trouvée en cache pérenne : {cached_wav_path}")
        return cached_wav_path

    temp_dl_path = os.path.join("/tmp", f"dl_{stable_key}")
    print(f"📥 Téléchargement de la voix de référence : {clean_base}")
    
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-Agent', 'Calmi-TTS-Service')]
    urllib.request.install_opener(opener)
    urllib.request.urlretrieve(voice_url, temp_dl_path)

    converted_wav = convert_to_wav(temp_dl_path, cached_wav_path)
    if os.path.exists(temp_dl_path):
        os.remove(temp_dl_path)

    try:
        volume.commit()
        print(f"💾 Voix de référence persistée dans le Volume Modal : {converted_wav}")
    except Exception as commit_err:
        print(f"⚠️ Avertissement commit volume Modal : {commit_err}")
        
    return converted_wav

def split_into_clean_sentences(text: str, max_sentence_chars: int = 200) -> List[str]:
    """Découpe un paragraphe en phrases courtes et naturelles (<= 200 chars) pour rester
    strictement dans la fenêtre d'attention optimale (< 60 tokens) de CosyVoice2-0.5B-EU."""
    if not text or not text.strip():
        return []

    # Nettoyage des espaces multiples et tirets de dialogue en début de ligne
    cleaned = re.sub(r'\s+', ' ', text.strip())
    cleaned = re.sub(r'^[—–\-]\s*', '', cleaned)

    # 1. Découpage primaire sur la ponctuation forte (. ! ? … ;)
    raw_sents = re.split(r'(?<=[.!?…;])\s+', cleaned)
    final_sentences: List[str] = []

    for sent in raw_sents:
        sent = sent.strip()
        if not sent:
            continue
        if len(sent) <= max_sentence_chars:
            final_sentences.append(sent)
        else:
            # 2. Si une phrase dépasse max_sentence_chars, découper sur les deux-points ou virgules
            clauses = re.split(r'(?<=[,:])\s+', sent)
            current_clause = ""
            for clause in clauses:
                clause = clause.strip()
                if not clause:
                    continue
                if not current_clause:
                    current_clause = clause
                elif len(current_clause) + 1 + len(clause) <= max_sentence_chars:
                    current_clause += " " + clause
                else:
                    if current_clause[-1] not in ".!?…":
                        current_clause += "."
                    final_sentences.append(current_clause)
                    current_clause = clause
            if current_clause:
                if current_clause[-1] not in ".!?…":
                    current_clause += "."
                final_sentences.append(current_clause)

    return [s for s in final_sentences if re.search(r'[a-zA-ZÀ-ÿ0-9]', s)]


def chunk_text_optimized(
    text: str, 
    max_chars: int = 400,
    paragraph_pause_sec: float = 1.0,
    chapter_pause_sec: float = 3.0,
    default_instruct: Optional[str] = None,
    enable_sleep_pacing: bool = True
) -> List[Tuple[str, float, Optional[str]]]:
    """Découpe l'histoire paragraphe par paragraphe avec pauses naturelles et progression
    feutrée du rythme du coucher (Sleep Pacing)."""
    if not text or not text.strip():
        return []

    raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]
    total_paras = len(paragraphs)
    
    chapter_pattern = r'^\s*(?:#+\s*|#*\s*(?:chapitre|partie|épisode|prologue|épilogue|introduction|conclusion)\b)'
    tag_pattern = r'^\s*\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]'

    chunks_with_pauses: List[Tuple[str, float, Optional[str]]] = []
    current_instruct = default_instruct

    for idx, para in enumerate(paragraphs):
        progress = (idx / float(total_paras - 1)) if total_paras > 1 else 0.0

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

        is_chapter = bool(re.match(chapter_pattern, para_clean, re.IGNORECASE))
        
        if idx == 0:
            pause_before = 0.0
        elif is_chapter:
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

        instruct = current_instruct
        if enable_sleep_pacing and progress >= 0.66:
            sleep_suffix = ", very slow, soft, sleepy bedtime pace"
            if instruct:
                if sleep_suffix not in instruct:
                    instruct = instruct + sleep_suffix
            else:
                instruct = "Very slow, soft, sleepy bedtime voice"

        chunks_with_pauses.append((para_clean, pause_before, instruct))

    return chunks_with_pauses

class TTSRequest(BaseModel):
    text: str
    voice_ref_url: Optional[str] = None
    voice_ref_path: Optional[str] = None
    voiceRefPath: Optional[str] = None
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
    gpu=["L4", "A10G"],
    image=image,
    volumes={"/cache": volume},
    timeout=1800,
    scaledown_window=300,  # 5 minutes warm keep-alive
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

        # Initialisation du moteur principal : CosyVoice 2 EU
        print("⚡ [CalmiTTSGPU] Initialisation du moteur CosyVoice 2 (Hi! PARIS EU)...")
        start = time.time()
        from cosyvoice2_eu import load
        self.cosy_model = load()
        self.engine = "cosyvoice2"
        self.speaker_cache = {}
        if os.path.exists("/root/default_ref.wav"):
            with torch.inference_mode():
                self._get_speaker_conditioning("/root/default_ref.wav")
        print(f"✅ [CalmiTTSGPU] CosyVoice 2 EU prêt sur {self.device.upper()} en {time.time() - start:.2f}s !")

    def _get_speaker_conditioning(self, prompt_path: str, prompt_text: str = "") -> dict:
        """Extrait et met en cache les tenseurs d'empreinte vocale complète (Zero-Shot LLM + Flow Matching)
        dans la fenêtre optimale de 5 à 8 secondes de CosyVoice 2."""
        # Fenêtres optimales calées sur les silences naturels de chaque enregistrement de référence (6-8s)
        OPTIMAL_VOICE_PROMPTS = {
            "b93c7425-7b62-4bc6-9356-1870140560a9": (
                0.35, 7.60,
                "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi."
            ),
            "fd9c4da7a70b0157c0fec4c3bdabeb9e": (
                0.35, 7.60,
                "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi."
            ),
            "3788ec01-c177-45ff-a893-ec194bb560bf": (
                0.20, 8.20,
                "Coucou mon chéri, installe-toi bien chaudement. Papy et Mamie sont là pour te faire voyager dans un monde plein de magie et d'aventures ce soir."
            ),
            "1c8c80d9491886602913414bbfa27b0d": (
                0.20, 8.20,
                "Coucou mon chéri, installe-toi bien chaudement. Papy et Mamie sont là pour te faire voyager dans un monde plein de magie et d'aventures ce soir."
            ),
            "b17cb63d-1d64-4328-b8e1-c02d1c5bf93b": (
                0.10, 7.50,
                "Bienvenue dans la forêt magique ! Je suis ton compagnon tout doux."
            ),
            "937aa960-4633-42ef-9ab3-ae4fcf4c5df4": (
                0.10, 7.80,
                "Hou hou ! Je suis le gardien du ciel étoilé. Mes ailes déployées me permettent de voler tout là-haut au-dessus des nuages."
            ),
            "4e1e6013-143f-49ad-9982-866a2577d00e": (
                0.10, 7.50,
                "Salut ! Avec mon doudou et mon super courage, rien ne me fait peur."
            ),
        }

        matched_window = None
        for vid, win_tuple in OPTIMAL_VOICE_PROMPTS.items():
            if vid in prompt_path:
                matched_window = win_tuple
                break

        resolved_prompt = matched_window[2] if matched_window else (prompt_text.strip() if prompt_text else "")
        resolved_prompt = re.sub(r'\.{2,}', '.', resolved_prompt).strip()

        cache_key = f"{prompt_path}::{resolved_prompt}"
        if cache_key in self.speaker_cache:
            return self.speaker_cache[cache_key]

        from cosyvoice.utils.file_utils import load_wav
        t_spk = time.time()
        frontend = self.cosy_model._model.frontend
        sample_rate = self.cosy_model._model.sample_rate
        prompt_speech_16k = load_wav(prompt_path, 16000)

        if matched_window:
            start_s, end_s, _ = matched_window
            start_idx = int(16000 * start_s)
            end_idx = min(prompt_speech_16k.shape[1], int(16000 * end_s))
            if end_idx > start_idx + 16000:
                prompt_speech_16k = prompt_speech_16k[:, start_idx:end_idx]
        else:
            # Pour tout nouveau clone vocal (> 8.5s), conserver les 8 premières secondes et les 2 premières phrases
            max_samples = 16000 * 8
            if prompt_speech_16k.shape[1] > max_samples:
                prompt_speech_16k = prompt_speech_16k[:, :max_samples]
                if resolved_prompt:
                    sents = re.split(r'(?<=[.!?])\s+', resolved_prompt)
                    if len(sents) >= 2:
                        resolved_prompt = " ".join(sents[:2]).strip()

        if resolved_prompt:
            try:
                norm_prompt = frontend.text_normalize(resolved_prompt, split=False, text_frontend=True)
                if isinstance(norm_prompt, list):
                    norm_prompt = " ".join(norm_prompt)
            except Exception:
                norm_prompt = resolved_prompt
            base_input = frontend.frontend_zero_shot('Bonjour.', norm_prompt, prompt_speech_16k, sample_rate, '')
            mode_label = "zero_shot"
        else:
            base_input = frontend.frontend_cross_lingual('Bonjour.', prompt_speech_16k, sample_rate, '')
            mode_label = "cross_lingual"

        base_input.pop('text', None)
        base_input.pop('text_len', None)
        self.speaker_cache[cache_key] = base_input
        print(f"🎙️ Empreinte vocale [{mode_label}] extraite et mise en cache GPU ({prompt_path}) en {time.time() - t_spk:.2f}s")
        return base_input

    def _synthesize_block_fast(self, text: str, prompt_path: str, prompt_text: str = "", sentence_pause_sec: float = 0.18) -> Tuple[np.ndarray, int]:
        """Synthétise un bloc narratif phrase par phrase (<= 180 chars, text_frontend=True)
        en réutilisant l'empreinte vocale Zero-Shot pré-calculée en mémoire GPU."""
        frontend = self.cosy_model._model.frontend
        model = self.cosy_model._model.model
        sr = self.cosy_model.sample_rate
        spk_cond = self._get_speaker_conditioning(prompt_path, prompt_text=prompt_text)

        raw_sentences = split_into_clean_sentences(text, max_sentence_chars=180)
        if not raw_sentences:
            raw_sentences = [text.strip()]

        sentence_wavs = []
        for s_idx, raw_sent in enumerate(raw_sentences):
            try:
                norm_segments = frontend.text_normalize(raw_sent, split=True, text_frontend=True)
                if not norm_segments:
                    norm_segments = [raw_sent]
            except Exception:
                norm_segments = [raw_sent]

            for seg in norm_segments:
                seg_clean = seg.strip() if isinstance(seg, str) else ""
                if not seg_clean:
                    continue
                tts_text_token, tts_text_token_len = frontend._extract_text_token(seg_clean)
                model_input = {
                    **spk_cond,
                    'text': tts_text_token,
                    'text_len': tts_text_token_len,
                }
                for model_output in model.tts(**model_input, stream=False, speed=1.0):
                    wav_tensor = model_output['tts_speech']
                    if hasattr(wav_tensor, 'cpu'):
                        w_np = wav_tensor.cpu().numpy()
                    else:
                        w_np = np.array(wav_tensor, dtype=np.float32)
                    if w_np.ndim > 1:
                        w_np = w_np.squeeze()
                    sentence_wavs.append(w_np)

            # Légère respiration naturelle entre deux phrases d'un même paragraphe
            if s_idx < len(raw_sentences) - 1 and sentence_pause_sec > 0:
                sentence_wavs.append(np.zeros(int(sr * sentence_pause_sec), dtype=np.float32))

        if not sentence_wavs:
            return np.zeros(int(sr * 0.1), dtype=np.float32), sr
        return np.concatenate(sentence_wavs), sr

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
                v_key = request.voice_ref_path or request.voiceRefPath or request.voice_ref_url
                ref_audio_path = download_and_cache_voice(request.voice_ref_url.strip(), voice_key=v_key)
            except Exception as e:
                print(f"⚠️ Erreur téléchargement voix ({e}), fallback sur voix par défaut.")
                ref_audio_path = DEFAULT_LOCAL_REF if os.path.exists(DEFAULT_LOCAL_REF) else None
        else:
            ref_audio_path = DEFAULT_LOCAL_REF if os.path.exists(DEFAULT_LOCAL_REF) else None

        paragraph_pause_sec = request.paragraph_pause_ms / 1000.0 if request.paragraph_pause_ms is not None else 1.0
        sentence_pause_sec = request.sentence_pause_ms / 1000.0 if request.sentence_pause_ms is not None else 0.20
        global_instruct = request.instruct.strip() if request.instruct and request.instruct.strip() else None

        text_chunks = chunk_text_optimized(
            request.text, 
            max_chars=400,
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
                print(f"🎭 [{req_id}] Théâtre Audio Multi-Voix détecté ({len(request.segments)} répliques/segments bruts) !")
                
                # Optimisation : Fusion des segments consécutifs du même locuteur
                merged_segments = []
                for s in request.segments:
                    stext = s.get("text", "").strip()
                    if not stext:
                        continue
                    s_ref_url = s.get("voiceRefUrl")
                    s_voice_id = s.get("voiceId")
                    s_speaker_key = s_ref_url or s_voice_id or "narrator"
                    
                    if (merged_segments and 
                        merged_segments[-1]["speaker_key"] == s_speaker_key and 
                        (len(merged_segments[-1]["text"]) + len(stext) < 1200)):
                        merged_segments[-1]["text"] += "\n\n" + stext
                    else:
                        merged_segments.append({
                            **s,
                            "text": stext,
                            "speaker_key": s_speaker_key
                        })
                
                print(f"🎭 [{req_id}] Segments optimisés après fusion : {len(merged_segments)} blocs (au lieu de {len(request.segments)})")
                previous_speaker = None
                
                for idx, seg in enumerate(merged_segments):
                    seg_text = seg.get("text", "").strip()
                    if not seg_text:
                        continue

                    t0 = time.time()
                    seg_ref_url = seg.get("voiceRefUrl")
                    seg_speaker_key = seg.get("speaker_key") or "narrator"
                    seg_ref_path_prop = seg.get("voiceRefPath") or seg.get("voice_ref_path")

                    seg_ref_path = None
                    if seg_ref_url and seg_ref_url.strip():
                        try:
                            seg_ref_path = download_and_cache_voice(seg_ref_url.strip(), voice_key=seg_ref_path_prop or seg_ref_url)
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

                    prompt_target = seg_ref_path if (seg_ref_path and os.path.exists(seg_ref_path)) else DEFAULT_LOCAL_REF
                    seg_prompt_text = (seg.get("ref_text") or seg.get("transcript") or (clean_prompt if seg_ref_path == ref_audio_path else "") or "").strip()
                    wav_np, current_sr = self._synthesize_block_fast(
                        text=seg_text,
                        prompt_path=prompt_target,
                        prompt_text=seg_prompt_text,
                        sentence_pause_sec=sentence_pause_sec
                    )
                    sr = current_sr

                    if seg_pause > 0:
                        pause_samples = int(sr * seg_pause)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    speaker_label = seg.get("speakerName") or seg.get("roleCategory") or "Narrateur"
                    print(f"  ├─ [Théâtre] Segment {idx+1}/{len(merged_segments)} ({speaker_label}: {len(seg_text)} chars) généré en {time.time() - t0:.2f}s")

            else:
                # Inférence CosyVoice 2 phrase par phrase avec empreinte vocale pré-cachée en GPU
                prompt_target = ref_audio_path if (ref_audio_path and os.path.exists(ref_audio_path)) else DEFAULT_LOCAL_REF
                for idx, chunk_data in enumerate(text_chunks):
                    chunk, pause_before, chunk_instruct = chunk_data
                    t0 = time.time()

                    wav_np, current_sr = self._synthesize_block_fast(
                        text=chunk,
                        prompt_path=prompt_target,
                        prompt_text=clean_prompt,
                        sentence_pause_sec=sentence_pause_sec
                    )
                    sr = current_sr

                    # Insertion des silences sur CPU
                    if pause_before > 0:
                        pause_samples = int(sr * pause_before)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    print(f"  ├─ [CosyVoice2] Paragraphe {idx+1}/{len(text_chunks)} ({len(chunk)} chars) généré en {time.time() - t0:.2f}s")



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
            headers={
                "Content-Disposition": f"attachment; filename=calmi_gpu_{req_id}.wav",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
            }
        )

    @modal.fastapi_endpoint(method="POST")
    def synthesize_async(self, request: TTSRequest):
        from fastapi.responses import JSONResponse
        req_id = str(uuid.uuid4())[:8]
        effective_webhook_id = request.webhook_id or request.requestId
        effective_story_id = request.story_id or request.storyId
        print(f"🚀 [{req_id}] Requête GPU reçue (Asynchrone). Webhook ID: {effective_webhook_id}, Story ID: {effective_story_id}")
        
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
        }

        if not effective_webhook_id:
            return JSONResponse(
                status_code=400, 
                content={"error": "webhook_id ou requestId est obligatoire pour le mode asynchrone"},
                headers=cors_headers
            )

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
            },
            headers=cors_headers
        )

    @modal.method()
    def synthesize_direct(self, request_dict: dict) -> bytes:
        req_id = str(uuid.uuid4())[:8]
        request = TTSRequest(**request_dict)
        wav_bytes, sr = self._process_synthesis(request, req_id)
        return wav_bytes

    @modal.method()
    def process_async_task(self, request_dict: dict, req_id: str):
        import requests
        import traceback
        request = TTSRequest(**request_dict)
        print(f"⚙️ [{req_id}] Début du traitement asynchrone GPU...")
        try:
            wav_bytes, sr = self._process_synthesis(request, req_id)
            
            target_story_id = request.story_id or request.storyId
            target_webhook_id = request.webhook_id or request.requestId
            target_voice_id = request.voiceId or "custom"

            print(f"📤 [{req_id}] Téléversement de l'audio complet vers Supabase (storyId: {target_story_id}, requestId: {target_webhook_id})...")
            self._upload_to_supabase(wav_bytes, target_story_id, target_webhook_id, target_voice_id, f"{req_id}_final")
        except Exception as e:
            print(f"💥 [{req_id}] Erreur critique dans process_async_task: {e}")
            traceback.print_exc()
            raise e


# ==============================================================================
# CPU FAST-GATEWAY: Répond HTTP 202 en < 300ms sans attendre le cold-start du GPU
# ==============================================================================
gateway_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libsndfile1")
    .pip_install("numpy", "soundfile", "pydantic", "fastapi", "requests")
)

@app.function(
    image=gateway_image,
    timeout=60,
    scaledown_window=300,
)
@modal.fastapi_endpoint(method="POST")
def synthesize_async_fast(request: TTSRequest):
    from fastapi.responses import JSONResponse
    req_id = str(uuid.uuid4())[:8]
    effective_webhook_id = request.webhook_id or request.requestId
    effective_story_id = request.story_id or request.storyId
    print(f"⚡ [{req_id}] CPU Fast-Gateway: Réception requête asynchrone ({len(request.text)} chars). Webhook: {effective_webhook_id}")
    
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
    }

    if not effective_webhook_id:
        return JSONResponse(
            status_code=400,
            content={"error": "webhook_id ou requestId est obligatoire"},
            headers=cors_headers
        )

    req_dict = request.model_dump()
    req_dict["webhook_id"] = effective_webhook_id
    req_dict["story_id"] = effective_story_id
    
    # Déclenche le traitement GPU en arrière-plan sans bloquer la réponse HTTP
    CalmiTTSGPU().process_async_task.spawn(req_dict, req_id)

    return JSONResponse(
        status_code=202,
        content={
            "status": "accepted",
            "message": "Génération audio lancée sur GPU en arrière-plan.",
            "request_id": req_id,
            "webhook_id": effective_webhook_id
        },
        headers=cors_headers
    )

