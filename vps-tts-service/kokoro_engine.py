import os
import io
import re
import time
import requests
import numpy as np
import soundfile as sf
from typing import Optional, List, Tuple

DEFAULT_SUPABASE_UPLOAD_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n"
DEFAULT_WEBHOOK_SECRET = "qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc="

# Mappage des voix françaises par défaut dans Kokoro-82M
KOKORO_FRENCH_VOICES = {
    "standard-french-female": "ff_siwis",
    "standard-french-female-alt": "hf_alpha",
    "standard-french-male": "hm_omega",
    "default": "ff_siwis"
}

def master_audio_bytes(input_wav_bytes: bytes, sr: int = 24000) -> bytes:
    """Normalisation broadcast EBU R128 (-16 LUFS) via FFmpeg"""
    import subprocess, tempfile
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as in_f:
            in_f.write(input_wav_bytes)
            in_path = in_f.name
        out_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        
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
    except Exception:
        return input_wav_bytes

class KokoroStorySynthesizer:
    def __init__(self, default_voice: str = "ff_siwis"):
        self.default_voice = default_voice
        self._pipeline = None
        self._sample_rate = 24000

    @property
    def pipeline(self):
        """Initialisation paresseuse (lazy loading) du pipeline Kokoro avec support français"""
        if self._pipeline is None:
            print("🚀 [KokoroEngine] Initialisation du pipeline Kokoro-82M (lang='f')...")
            start = time.time()
            from kokoro import KPipeline
            self._pipeline = KPipeline(lang_code='f')
            print(f"✅ [KokoroEngine] Pipeline Kokoro initialisé en {time.time() - start:.2f}s !")
        return self._pipeline

    def clean_text_and_extract_tags(self, text: str) -> str:
        """Nettoie les balises d'émotion ou d'instructions techniques pour la synthèse pure"""
        cleaned = re.sub(r'\[.*?\]', '', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def chunk_story_with_pacing(
        self,
        text: str,
        paragraph_pause_sec: float = 0.8,
        chapter_pause_sec: float = 2.5,
        enable_sleep_pacing: bool = True
    ) -> List[Tuple[str, float, float]]:
        """
        Découpe l'histoire en paragraphes avec pauses dynamiques et ajustement de vitesse (Sleep Pacing).
        Retourne une liste de tuples : (texte_paragraphe, pause_avant_secondes, vitesse_recommandee)
        """
        if not text or not text.strip():
            return []

        raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
        paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]
        total_paras = len(paragraphs)
        
        chapter_pattern = r'^\s*(?:#+\s*|#*\s*(?:chapitre|partie|épisode|prologue|épilogue|introduction|conclusion)\b)'
        chunks = []
        base_speed = 0.95

        for idx, para in enumerate(paragraphs):
            clean_para = self.clean_text_and_extract_tags(para)
            if not clean_para:
                continue

            progress = (idx / float(total_paras - 1)) if total_paras > 1 else 0.0

            if idx == 0:
                pause_before = 0.0
            elif re.match(chapter_pattern, clean_para, re.IGNORECASE):
                pause_before = chapter_pause_sec
            else:
                if enable_sleep_pacing:
                    if progress < 0.33:
                        pause_before = paragraph_pause_sec
                    elif progress < 0.66:
                        pause_before = paragraph_pause_sec * 1.5
                    else:
                        pause_before = paragraph_pause_sec * 2.2
                else:
                    pause_before = paragraph_pause_sec

            current_speed = base_speed
            if enable_sleep_pacing and progress >= 0.66:
                current_speed = base_speed * 0.90

            chunks.append((clean_para, pause_before, current_speed))

        return chunks

    def synthesize_with_fast_play(
        self,
        text: str,
        story_id: str,
        request_id: str,
        voice_id: Optional[str] = None,
        enable_sleep_pacing: bool = True,
        req_id: str = "fast_play"
    ) -> Tuple[bytes, int, float]:
        """
        Synthèse avec Fast-Play :
        1. Synthétise le premier paragraphe (Chunk 0) en ~1-2s.
        2. Upload immédiatement Chunk 0 vers Supabase -> L'audio devient jouable en < 3s pour l'utilisateur.
        3. Poursuit la synthèse des blocs suivants (Chunks 1..N).
        4. Concatène tous les blocs et upload l'audio final complet.
        """
        start_time = time.time()
        voice_key = voice_id if voice_id in KOKORO_FRENCH_VOICES else "default"
        target_voice = KOKORO_FRENCH_VOICES.get(voice_key, self.default_voice)

        chunks = self.chunk_story_with_pacing(text, enable_sleep_pacing=enable_sleep_pacing)
        if not chunks:
            raise ValueError("Aucun texte à synthétiser")

        sr = self._sample_rate
        generated_segments = []

        # 1. Synthèse du premier chunk (Fast-Play)
        first_chunk_text, first_pause, first_speed = chunks[0]
        print(f"⚡ [{req_id}] FAST-PLAY : Synthèse prioritaire du premier paragraphe ({len(first_chunk_text)} chars)...")
        
        t0 = time.time()
        chunk0_segments = []
        generator = self.pipeline(first_chunk_text, voice=target_voice, speed=first_speed, split_pattern=r'\n+')
        for _, _, audio in generator:
            if audio is not None and len(audio) > 0:
                audio_np = audio.numpy() if hasattr(audio, 'numpy') else np.array(audio, dtype=np.float32)
                chunk0_segments.append(audio_np)

        if chunk0_segments:
            chunk0_audio = np.concatenate(chunk0_segments)
            generated_segments.append(chunk0_audio)
            print(f"🚀 [{req_id}] FAST-PLAY : Chunk 0 généré en {time.time() - t0:.2f}s ! Durée: {len(chunk0_audio)/sr:.1f}s")
            
            # Téléversement immédiat de Chunk 0 si histoire multi-paragraphes
            if len(chunks) > 1 and story_id and request_id:
                buf0 = io.BytesIO()
                sf.write(buf0, chunk0_audio, sr, format='WAV', subtype='PCM_16')
                buf0.seek(0)
                self.upload_to_supabase(
                    wav_bytes=master_audio_bytes(buf0.read(), sr),
                    story_id=story_id,
                    request_id=request_id,
                    voice_id=target_voice,
                    req_id=f"{req_id}_chunk0"
                )
                print(f"✅ [{req_id}] FAST-PLAY : Chunk 0 masterisé (-16 LUFS) téléversé ! L'histoire est audible immédiatement.")

        # 2. Synthèse des paragraphes suivants
        for idx in range(1, len(chunks)):
            chunk_text, pause_before, speed = chunks[idx]
            if pause_before > 0:
                pause_samples = int(sr * pause_before)
                generated_segments.append(np.zeros(pause_samples, dtype=np.float32))

            generator = self.pipeline(chunk_text, voice=target_voice, speed=speed, split_pattern=r'\n+')
            for _, _, audio in generator:
                if audio is not None and len(audio) > 0:
                    audio_np = audio.numpy() if hasattr(audio, 'numpy') else np.array(audio, dtype=np.float32)
                    generated_segments.append(audio_np)

        full_audio = np.concatenate(generated_segments)
        total_duration = len(full_audio) / float(sr)
        calc_time = time.time() - start_time
        print(f"🎉 [{req_id}] Histoire complète assemblée en {calc_time:.2f}s (Durée totale: {total_duration:.1f}s)")

        buffer = io.BytesIO()
        sf.write(buffer, full_audio, sr, format='WAV', subtype='PCM_16')
        buffer.seek(0)
        wav_bytes = buffer.read()

        # 3. Téléversement final de l'audio complet masterisé (-16 LUFS)
        if story_id and request_id:
            mastered_final = master_audio_bytes(wav_bytes, sr)
            self.upload_to_supabase(
                wav_bytes=mastered_final,
                story_id=story_id,
                request_id=request_id,
                voice_id=target_voice,
                req_id=f"{req_id}_final"
            )

        return wav_bytes, sr, total_duration

    def synthesize_multivoice_with_fast_play(
        self,
        segments: List[dict],
        story_id: str,
        request_id: str,
        req_id: str = "fast_play_multivoice"
    ) -> Tuple[bytes, int, float]:
        """Synthétise une histoire multi-voix théâtrale sur CPU avec Kokoro"""
        start_time = time.time()
        sr = self._sample_rate
        generated_segments = []
        previous_voice = None

        for idx, seg in enumerate(segments):
            seg_text = self.clean_text_and_extract_tags(seg.get("text", ""))
            if not seg_text:
                continue

            voice_hint = seg.get("voiceId") or "standard-french-female"
            target_voice = KOKORO_FRENCH_VOICES.get(voice_hint, self.default_voice)

            if idx == 0:
                seg_pause = 0.0
            elif target_voice == previous_voice:
                seg_pause = 0.25
            else:
                seg_pause = 0.50

            previous_voice = target_voice

            if seg_pause > 0:
                pause_samples = int(sr * seg_pause)
                generated_segments.append(np.zeros(pause_samples, dtype=np.float32))

            generator = self.pipeline(seg_text, voice=target_voice, speed=0.92, split_pattern=r'\n+')
            seg_audios = []
            for _, _, audio in generator:
                if audio is not None and len(audio) > 0:
                    audio_np = audio.numpy() if hasattr(audio, 'numpy') else np.array(audio, dtype=np.float32)
                    seg_audios.append(audio_np)

            if seg_audios:
                current_seg_audio = np.concatenate(seg_audios)
                generated_segments.append(current_seg_audio)

                if idx == 0 and len(segments) > 1 and story_id and request_id:
                    buf0 = io.BytesIO()
                    sf.write(buf0, current_seg_audio, sr, format='WAV', subtype='PCM_16')
                    buf0.seek(0)
                    self.upload_to_supabase(
                        wav_bytes=master_audio_bytes(buf0.read(), sr),
                        story_id=story_id,
                        request_id=request_id,
                        voice_id=target_voice,
                        req_id=f"{req_id}_chunk0"
                    )

        if not generated_segments:
            raise ValueError("Aucun segment audio généré pour le théâtre Kokoro.")

        full_audio = np.concatenate(generated_segments)
        total_duration = len(full_audio) / float(sr)
        calc_time = time.time() - start_time
        print(f"🎉 [{req_id}] Théâtre multi-voix Kokoro assemblé en {calc_time:.2f}s (Durée: {total_duration:.1f}s)")

        buffer = io.BytesIO()
        sf.write(buffer, full_audio, sr, format='WAV', subtype='PCM_16')
        buffer.seek(0)
        wav_bytes = buffer.read()

        if story_id and request_id:
            mastered_final = master_audio_bytes(wav_bytes, sr)
            self.upload_to_supabase(
                wav_bytes=mastered_final,
                story_id=story_id,
                request_id=request_id,
                voice_id="multivoice",
                req_id=f"{req_id}_final"
            )

        return wav_bytes, sr, total_duration

    def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        enable_sleep_pacing: bool = True,
        req_id: str = "req"
    ) -> Tuple[bytes, int, float]:
        """Synthétise l'intégralité d'une histoire via Kokoro-82M sur CPU (sans upload automatique)"""
        start_time = time.time()
        voice_key = voice_id if voice_id in KOKORO_FRENCH_VOICES else "default"
        target_voice = KOKORO_FRENCH_VOICES.get(voice_key, self.default_voice)

        chunks = self.chunk_story_with_pacing(text, enable_sleep_pacing=enable_sleep_pacing)
        print(f"🎙️ [{req_id}] Synthèse Kokoro-82M de {len(chunks)} blocs avec voix '{target_voice}'...")

        generated_segments = []
        sr = self._sample_rate

        for idx, (chunk_text, pause_before, speed) in enumerate(chunks):
            if pause_before > 0:
                pause_samples = int(sr * pause_before)
                generated_segments.append(np.zeros(pause_samples, dtype=np.float32))

            generator = self.pipeline(chunk_text, voice=target_voice, speed=speed, split_pattern=r'\n+')
            for _, _, audio in generator:
                if audio is not None and len(audio) > 0:
                    audio_np = audio.numpy() if hasattr(audio, 'numpy') else np.array(audio, dtype=np.float32)
                    generated_segments.append(audio_np)

        if not generated_segments:
            raise ValueError("Aucun signal audio généré par Kokoro.")

        full_audio = np.concatenate(generated_segments)
        total_duration = len(full_audio) / float(sr)
        calc_time = time.time() - start_time
        rtf = calc_time / total_duration if total_duration > 0 else 0

        print(f"🎉 [{req_id}] Histoire synthétisée en {calc_time:.2f}s (Durée audio: {total_duration:.1f}s, RTF: {rtf:.3f})")

        buffer = io.BytesIO()
        sf.write(buffer, full_audio, sr, format='WAV', subtype='PCM_16')
        buffer.seek(0)
        wav_bytes = buffer.read()

        return wav_bytes, sr, total_duration

    @staticmethod
    def upload_to_supabase(
        wav_bytes: bytes,
        story_id: str,
        request_id: str,
        voice_id: str = "standard-french-female",
        upload_url: str = DEFAULT_SUPABASE_UPLOAD_URL,
        secret: str = DEFAULT_WEBHOOK_SECRET,
        req_id: str = "upload"
    ) -> bool:
        """Téléverse le fichier audio WAV vers l'Edge Function Supabase upload-audio-from-n8n"""
        print(f"📤 [{req_id}] Envoi de l'audio vers Supabase (storyId={story_id}, requestId={request_id})...")
        files = {"audioFile": (f"{request_id}.wav", wav_bytes, "audio/wav")}
        data = {
            "requestId": request_id,
            "storyId": story_id,
            "voiceId": voice_id
        }
        headers = {"x-webhook-secret": secret}

        try:
            res = requests.post(upload_url, files=files, data=data, headers=headers, timeout=120)
            if res.status_code in [200, 201]:
                print(f"✅ [{req_id}] Upload Supabase réussi avec succès ! L'histoire est READY.")
                return True
            else:
                print(f"❌ [{req_id}] Erreur HTTP upload Supabase: {res.status_code} - {res.text}")
                return False
        except Exception as e:
            print(f"💥 [{req_id}] Exception lors de l'upload Supabase: {e}")
            return False

synthesizer = KokoroStorySynthesizer()
