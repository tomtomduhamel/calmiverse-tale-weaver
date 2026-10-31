import os
import io
import re
import copy
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

# 1. Image Docker Modal avec FFmpeg, Chatterbox Multilingual (MIT) et CosyVoice 2 (Hi! PARIS EU)
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("sox", "libsox-fmt-all", "ffmpeg", "libsndfile1", "git", "build-essential")
    .pip_install(
        "setuptools<70.0.0",
        "wheel",
        "torch==2.3.1",
        "torchaudio==2.3.1",
        "cosyvoice2-eu",
        "soundfile",
        "pydantic",
        "fastapi",
        "requests",
        "resemble-perth",
        "s3tokenizer",
        "conformer",
        "safetensors",
        "spacy-pkuseg",
        "pykakasi",
    )
    .run_commands("pip install --no-deps chatterbox-tts && pip install 'transformers==4.46.3'")
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
    # 1. Pré-téléchargement et mise en cache de Chatterbox Multilingual (SOTA FR)
    try:
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        ChatterboxMultilingualTTS.from_pretrained(device="cpu")
        print("✅ Poids Chatterbox Multilingual pré-téléchargés et mis en cache dans le Volume Modal !")
    except Exception as e:
        print(f"⚠️ Avertissement pré-téléchargement Chatterbox Multilingual ({e})")

    # 2. Pré-téléchargement et mise en cache de CosyVoice 2 EU
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
    # Émotions vives & expressives (contes pour enfants & surjeu)
    "joy": "Cheerful, joyful, bright and lively storytelling voice for children.",
    "happy": "Cheerful, joyful, bright and lively storytelling voice for children.",
    "excited": "Enthusiastic, energetic, lively and animated storytelling voice.",
    "playful": "Playful, mischievous, amusing storytelling voice.",
    "angry": "Firm, indignant, dramatic, intense storytelling voice.",
    "colere": "Firm, indignant, dramatic, intense storytelling voice.",
    "sad": "Melancholic, gentle, tender, slightly sorrowful storytelling voice.",
    "triste": "Melancholic, gentle, tender, slightly sorrowful storytelling voice.",
    "scared": "Anxious, startled, breathless storytelling voice.",
    "peur": "Anxious, startled, breathless storytelling voice.",
    # Ambiances de lecture et coucher
    "warm": "Warm, engaging, gentle bedtime narrator for children.",
    "whisper": "Soft, gentle whispering voice, quiet bedtime narrator.",
    "mysterious": "Curious, intriguing, mysterious bedtime storytelling voice.",
    "calm": "Calm, peaceful, relaxed storytelling voice.",
    "sleepy": "Very slow, soft, sleepy bedtime voice."
}

# Table de conversion des nombres fréquents en français (remplace en_tn_model anglais !)
_FR_UNITS = [
    "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf"
]
_FR_TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"]

def _int_to_french(n: int) -> str:
    if n < 0:
        return "moins " + _int_to_french(-n)
    if n < 20:
        return _FR_UNITS[n]
    if n < 70:
        d, u = divmod(n, 10)
        if u == 0:
            return _FR_TENS[d]
        if u == 1:
            return f"{_FR_TENS[d]} et un"
        return f"{_FR_TENS[d]}-{_FR_UNITS[u]}"
    if n < 80:
        u = n - 60
        if u == 11:
            return "soixante et onze"
        return f"soixante-{_FR_UNITS[u]}"
    if n < 100:
        u = n - 80
        if u == 0:
            return "quatre-vingts"
        return f"quatre-vingt-{_FR_UNITS[u]}"
    if n == 100:
        return "cent"
    if n < 1000:
        c, r = divmod(n, 100)
        prefix = "cent" if c == 1 else f"{_FR_UNITS[c]} cent"
        if r == 0:
            return prefix + ("s" if c > 1 else "")
        return f"{prefix} {_int_to_french(r)}"
    if n == 1000:
        return "mille"
    if n < 10000:
        m, r = divmod(n, 1000)
        prefix = "mille" if m == 1 else f"{_int_to_french(m)} mille"
        if r == 0:
            return prefix
        return f"{prefix} {_int_to_french(r)}"
    return str(n)


def normalize_french_narrative_text(text: str) -> str:
    """Normaliseur narratif 100% Français :
    - N'utilise JAMAIS le normaliseur anglais (en_tn_model) de CosyVoice.
    - Préserve scrupuleusement la ponctuation expressive (!, ?, …) indispensable à l'émotion vocale,
      tout en retirant les guillemets et tirets parasites.
    - Évite les coupures de phrases au milieu d'une incise de dialogue (ex: « Au secours ! » cria Pierre).
    - Convertit les points-virgules (;) et espaces typographiques français avant ponctuation.
    """
    if not text or not text.strip():
        return ""

    s = text.strip()
    # 1. Espaces insécables et apostrophes typographiques
    s = s.replace("\u00a0", " ").replace("\u202f", " ").replace("\u2009", " ")
    s = s.replace("’", "'").replace("‘", "'").replace("`", "'")
    s = s.replace("“", "«").replace("”", "»")
    s = re.sub(r'\.{2,}', '…', s)

    # 2. Gestion des incises après guillemets fermants ou ponctuation expressive :
    # Préserve la ponctuation expressive (! ? …) sans la remplacer par une virgule pour que
    # Chatterbox module spontanément sa force et hauteur vocale.
    # Ex: « Je suis Cracrac ! » annonce-t-il -> Je suis Cracrac ! annonce-t-il
    # Ex: « Qui est là ? » murmure Sophie -> Qui est là ? murmure Sophie
    s = re.sub(r'([!?…])\s*»\s*,?\s*([a-zàâäéèêëîïôöùûüç])', r'\1 \2', s)
    s = re.sub(r'\s*»\s*,\s*', ', ', s)
    s = re.sub(r'\s*»\s+([a-zàâäéèêëîïôöùûüç])', r' \1', s)

    # 3. Suppression propre des guillemets restants (« et ») sans laisser de tokens BPE parasites
    s = re.sub(r':\s*«\s*', ' : ', s)
    s = s.replace("«", "").replace("»", "")

    # 4. Tirets de dialogue en début de phrase et tirets d'incise au milieu
    s = re.sub(r'(?:^|(?<=\s))[—–]\s*', '', s)
    s = re.sub(r'\s+[—–]\s+', ', ', s)

    # 5. Points-virgules français (souvent mal lus par les modèles TTS) :
    # S'il est suivi d'une majuscule -> point (.) ; s'il est suivi d'une minuscule -> virgule (,)
    s = re.sub(r'\s*;\s*(?=[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ])', '. ', s)
    s = re.sub(r'\s*;\s*', ', ', s)

    # 6. Conversion des nombres isolés (0..9999) en toutes lettres en français
    def _replace_num(match):
        try:
            val = int(match.group(0))
            return _int_to_french(val)
        except Exception:
            return match.group(0)

    s = re.sub(r'\b\d{1,4}\b', _replace_num, s)

    # 7. Suppression de l'espace typographique français avant (! ? : , .) pour coller au tokenizer BPE
    s = re.sub(r'\s+([,!?:.])', r'\1', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def resolve_speech_prosody_params(
    text: str,
    explicit_emotion: Optional[str] = None,
    is_dialogue: bool = False,
    progress: float = 0.0,
    enable_sleep_pacing: bool = False,
) -> Tuple[float, float, float]:
    """Calcule dynamiquement (exaggeration, cfg_weight, temperature) pour Chatterbox :
    - Évite la monotonie et insuffle le relief / surjeu adapté aux contes pour enfants.
    - Donne plus d'énergie et de présence aux dialogues et passages animés.
    - Adoucit le rythme en fin d'histoire si le sleep pacing est activé.
    """
    clean_text = text.lower()
    emo = (explicit_emotion or "").lower().strip()

    # Détection heuristique si aucune balise explicite n'est présente
    if not emo or emo in ["narrator", "custom", "none"]:
        if re.search(r'\b(s\'exclama|youpi|hourra|génial|sauta de joie|éclata de rire|riant|joyeu|fête|chouette|merveille|rigol|drôle)\b', clean_text) or ('!' in text and any(w in clean_text for w in ["bravo", "super", "incroyable", "regarde", "youpi", "ouah"])):
            emo = "joy"
        elif re.search(r'\b(colère|furieu|gronda|s\'énerva|tempêta|rage|mécontent|indigné|scandale)\b', clean_text):
            emo = "angry"
        elif re.search(r'\b(triste|sanglot|pleur|chagrin|déçu|larmes|désolé|peine|déchirant)\b', clean_text):
            emo = "sad"
        elif re.search(r'\b(peur|panique|effray|trembl|terreur|angoisse|monstre|frémir)\b', clean_text):
            emo = "scared"
        elif re.search(r'\b(chuchot|murmur|tout bas|à voix basse|discrètement|secret)\b', clean_text):
            emo = "whisper"
        elif re.search(r'\b(mystère|bizarre|étrange|sombre|qui va là|curieux|inconnu)\b', clean_text):
            emo = "mysterious"
        elif re.search(r'\b(bâill|s\'endorm|fatigué|sommeil|paupières lourdes|ronfl|dodo)\b', clean_text):
            emo = "sleepy"

    # Paramètres de base selon l'émotion détectée
    if emo in ["joy", "happy", "excited", "playful"]:
        exaggeration = 0.80
        cfg_weight = 0.50
        temperature = 0.80
    elif emo in ["angry", "colere"]:
        exaggeration = 0.85
        cfg_weight = 0.65  # Force et directivité accentuées
        temperature = 0.75
    elif emo in ["sad", "triste"]:
        exaggeration = 0.55
        cfg_weight = 0.50
        temperature = 0.62
    elif emo in ["scared", "peur"]:
        exaggeration = 0.75
        cfg_weight = 0.55
        temperature = 0.78
    elif emo in ["whisper"]:
        exaggeration = 0.45
        cfg_weight = 0.50
        temperature = 0.65
    elif emo in ["mysterious"]:
        exaggeration = 0.60
        cfg_weight = 0.50
        temperature = 0.70
    elif emo in ["sleepy"]:
        exaggeration = 0.40
        cfg_weight = 0.50
        temperature = 0.60
    elif emo in ["calm"]:
        exaggeration = 0.50
        cfg_weight = 0.50
        temperature = 0.70
    else:
        # Narration standard : fin de la neutralité monotone (0.55 au lieu de 0.35 !)
        exaggeration = 0.55
        cfg_weight = 0.50
        temperature = 0.75

    # Bonus de surjeu théâtral pour les répliques de personnages
    if is_dialogue:
        exaggeration = min(0.95, exaggeration + 0.15)
        temperature = min(0.85, max(temperature, 0.78))

    # Modulation douce du coucher en fin d'histoire (dernier tiers)
    if enable_sleep_pacing and progress >= 0.66:
        exaggeration = max(0.38, exaggeration * 0.80)
        temperature = max(0.58, temperature * 0.85)

    return (round(exaggeration, 2), round(cfg_weight, 2), round(temperature, 2))


def convert_to_wav(input_path: str, output_path: str) -> str:
    """Convertit l'enregistrement vocal de référence en WAV PCM 24kHz mono PUR studio.
    Applique un dé-boxage chirurgical à 420Hz et un expanseur doux (agate) pour assécher
    l'acoustique de la pièce et éliminer l'effet 'boîte de conserve' sans artefact métallique."""
    try:
        # 1. highpass=f=65 : supprime les infra-basses et bruits de manipulation sans altérer les voix graves
        # 2. equalizer=f=420:width_type=q:w=1.4:g=-3.5 : élimine la résonance creuse de pièce (anti-box)
        # 3. agate=range=0.06:threshold=0.03:ratio=2:attack=20:release=140 : assèche les réflexions entre les mots
        prompt_filter = "highpass=f=65,equalizer=f=420:width_type=q:w=1.4:g=-3.5,agate=range=0.06:threshold=0.03:ratio=2:attack=20:release=140"
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-af", prompt_filter,
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except Exception as e:
        print(f"⚠️ Erreur conversion FFmpeg filtrée ({e}), fallback simple...")
        try:
            cmd = ["ffmpeg", "-y", "-i", input_path, "-af", "highpass=f=55", "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", output_path]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return output_path
        except Exception:
            return input_path


def _apply_cosine_edges(wav: np.ndarray, sr: int = 24000, fade_in_ms: float = 12.0, fade_out_ms: float = 18.0) -> np.ndarray:
    """Applique un fondu cosinus doux en entrée et sortie de phrase pour éliminer
    tout clic de phase ou coupure brusque lors des enchaînements de phrases."""
    if wav is None or wav.size == 0:
        return wav
    out = wav.astype(np.float32, copy=True)
    n = out.shape[0]
    fi = min(int(sr * (fade_in_ms / 1000.0)), n // 4)
    fo = min(int(sr * (fade_out_ms / 1000.0)), n // 4)
    if fi > 1:
        curve_in = 0.5 * (1.0 - np.cos(np.linspace(0.0, np.pi, fi, dtype=np.float32)))
        out[:fi] *= curve_in
    if fo > 1:
        curve_out = 0.5 * (1.0 + np.cos(np.linspace(0.0, np.pi, fo, dtype=np.float32)))
        out[-fo:] *= curve_out
    return out


def master_audio_bytes(input_wav_bytes: bytes, sr: int = 24000) -> bytes:
    """Applique un mastering broadcast EBU R128 (-16 LUFS) 'Close-Mic Studio' pour les contes d'enfants :
    - Coupe les 450Hz (supprime définitivement la boîte de conserve)
    - Rehausse les 3.8kHz (+2.5dB) pour placer la voix immédiatement 'en avant'
    - Ajoute de l'air soyeux à 9.5kHz (+1.5dB)
    - Expander feutré (agate) pour supprimer toute queue d'écho résiduelle entre les phrases
    - Loudnorm calibré LRA=8 pour éviter tout pompage de fond."""
    import tempfile
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as in_f:
            in_f.write(input_wav_bytes)
            in_path = in_f.name
        out_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        
        audio_filter = (
            "highpass=f=60,"
            "equalizer=f=450:width_type=q:w=1.2:g=-3.0,"
            "equalizer=f=3800:width_type=q:w=1.0:g=+2.5,"
            "treble=g=+1.5:f=9500,"
            "agate=range=0.05:threshold=0.02:ratio=2:attack=15:release=120,"
            "loudnorm=I=-16:TP=-1.5:LRA=8:dual_mono=true"
        )
        cmd = [
            "ffmpeg", "-y", "-i", in_path,
            "-af", audio_filter,
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
    """Télécharge et met en cache l'extrait vocal pur studio (v3 anti-box) dans le Volume Modal"""
    if not voice_url:
        return "/root/default_ref.wav"

    if "user-voices" in voice_url:
        voice_url = voice_url.replace("user-voices", "voice-clones")

    cache_dir = "/cache/voices_cache"
    os.makedirs(cache_dir, exist_ok=True)
    
    clean_base = voice_url.split("?")[0]
    if voice_key and voice_key.strip():
        stable_key = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', voice_key.strip())
    else:
        file_part = clean_base.split("/")[-1]
        if file_part and len(file_part) > 3:
            stable_key = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file_part)
        else:
            stable_key = hashlib.md5(clean_base.encode('utf-8')).hexdigest()

    # Préfixe voice_studio_v3_ pour garantir une empreinte vocale asséchée et dé-boxée
    cached_wav_path = os.path.join(cache_dir, f"voice_studio_v3_{stable_key}.wav")
    
    if not (os.path.exists(cached_wav_path) and os.path.getsize(cached_wav_path) > 0):
        try:
            volume.reload()
        except Exception:
            pass

    if os.path.exists(cached_wav_path) and os.path.getsize(cached_wav_path) > 0:
        print(f"✅ Voix de référence studio trouvée en cache pérenne : {cached_wav_path}")
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
        print(f"💾 Voix de référence studio persistée dans le Volume Modal : {converted_wav}")
    except Exception as commit_err:
        print(f"⚠️ Avertissement commit volume Modal : {commit_err}")
        
    return converted_wav


def split_into_clean_sentences(text: str, max_sentence_chars: int = 230) -> List[str]:
    """Découpe un paragraphe en phrases françaises complètes et naturelles après normalisation narrative.
    Ne coupe JAMAIS avant une minuscule d'incise (ex: '! annonce-t-il' ou '? demande Joseph')."""
    cleaned = normalize_french_narrative_text(text)
    if not cleaned:
        return []

    # 1. Découpage uniquement lorsque la ponctuation forte (. ! ? …) est suivie d'une majuscule
    raw_sents = re.split(r'(?<=[.!?…])\s+(?=[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ])', cleaned)
    final_sentences: List[str] = []

    for sent in raw_sents:
        sent = sent.strip()
        if not sent:
            continue
        if len(sent) <= max_sentence_chars:
            if sent[-1] not in ".!?…":
                sent += "."
            final_sentences.append(sent)
        else:
            # 2. Si une phrase est très longue (> max_sentence_chars), découper proprement aux virgules/deux-points
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
    paragraph_pause_sec: float = 0.85,
    chapter_pause_sec: float = 2.5,
    default_instruct: Optional[str] = None,
    enable_sleep_pacing: bool = True
) -> List[Tuple[str, float, Optional[str], Optional[str]]]:
    """Découpe l'histoire paragraphe par paragraphe avec pauses naturelles, émotion détectée
    et progression feutrée du rythme du coucher (Sleep Pacing).
    Retourne [(para_texte, pause_avant, emotion_tag, instruct_str), ...]"""
    if not text or not text.strip():
        return []

    raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]
    total_paras = len(paragraphs)
    
    chapter_pattern = r'^\s*(?:#+\s*|#*\s*(?:chapitre|partie|épisode|prologue|épilogue|introduction|conclusion)\b)'
    tag_pattern = r'^\s*\[(joy|happy|excited|playful|angry|colere|sad|triste|scared|peur|warm|whisper|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]'

    chunks_with_pauses: List[Tuple[str, float, Optional[str], Optional[str]]] = []
    current_instruct = default_instruct
    current_emotion = None

    for idx, para in enumerate(paragraphs):
        progress = (idx / float(total_paras - 1)) if total_paras > 1 else 0.0

        match_tag = re.search(tag_pattern, para, re.IGNORECASE)
        if match_tag:
            tag_val = match_tag.group(1).strip()
            if tag_val.lower().startswith("instruct:"):
                current_instruct = tag_val[len("instruct:"):].strip()
                current_emotion = "custom"
            else:
                current_emotion = tag_val.lower()
                current_instruct = EMOTION_MAP.get(current_emotion, default_instruct)

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
                    pause_before = paragraph_pause_sec * 1.35
                else:
                    pause_before = paragraph_pause_sec * 2.0
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

        chunks_with_pauses.append((para_clean, pause_before, current_emotion, instruct))

    return chunks_with_pauses


class TTSRequest(BaseModel):
    text: str
    voice_ref_url: Optional[str] = None
    voice_ref_path: Optional[str] = None
    voiceRefPath: Optional[str] = None
    ref_text: Optional[str] = None
    instruct: Optional[str] = None
    language: str = "fr"
    sentence_pause_ms: Optional[int] = 160
    paragraph_pause_ms: Optional[int] = 850
    chapter_pause_ms: Optional[int] = 2500
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


# Fenêtres optimales calées sur les silences naturels de chaque enregistrement de référence (6-8.5s)
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
        self.speaker_cache = {}
        self.chatterbox_cond_cache = {}
        self.trimmed_prompt_cache = {}
        self.chatterbox_model = None
        self.cosy_model = None
        self.engine = "chatterbox"

        # 1. Initialisation du moteur SOTA principal : Chatterbox Multilingual (MIT)
        try:
            print("⚡ [CalmiTTSGPU] Initialisation de Chatterbox Multilingual (Resemble AI - MIT)...")
            t_cb = time.time()
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            self.chatterbox_model = ChatterboxMultilingualTTS.from_pretrained(device=self.device)
            self.engine = "chatterbox"
            print(f"✅ [CalmiTTSGPU] Chatterbox Multilingual prêt sur {self.device.upper()} en {time.time() - t_cb:.2f}s !")
        except Exception as cb_err:
            print(f"⚠️ [CalmiTTSGPU] Impossible de charger Chatterbox Multilingual ({cb_err}), bascule sur CosyVoice2-EU.")
            self.chatterbox_model = None
            self.engine = "cosyvoice2"

        # 2. Initialisation de CosyVoice 2 EU (disponible en parallèle / fallback)
        try:
            print("⚡ [CalmiTTSGPU] Initialisation de CosyVoice 2 (Hi! PARIS EU)...")
            start = time.time()
            from cosyvoice2_eu import load
            self.cosy_model = load()
            if os.path.exists("/root/default_ref.wav"):
                with torch.inference_mode():
                    self._get_speaker_conditioning("/root/default_ref.wav")
            print(f"✅ [CalmiTTSGPU] CosyVoice 2 EU prêt sur {self.device.upper()} en {time.time() - start:.2f}s !")
        except Exception as cv_err:
            print(f"⚠️ [CalmiTTSGPU] Erreur chargement CosyVoice 2 EU : {cv_err}")

    def _get_trimmed_prompt_wav(self, prompt_path: str) -> Tuple[str, Optional[str]]:
        """Découpe l'enregistrement de référence sur sa fenêtre optimale sans silence parasite (6-10s)
        et retourne (chemin_wav_propre, transcription_associée)."""
        if prompt_path in self.trimmed_prompt_cache:
            return self.trimmed_prompt_cache[prompt_path]

        matched_window = None
        for vid, win_tuple in OPTIMAL_VOICE_PROMPTS.items():
            if vid in prompt_path:
                matched_window = win_tuple
                break

        try:
            data, sr = sf.read(prompt_path, dtype='float32')
            if data.ndim > 1:
                data = data.mean(axis=1)

            if matched_window:
                start_s, end_s, win_transcript = matched_window
                start_idx = int(sr * start_s)
                end_idx = min(len(data), int(sr * end_s))
                if end_idx > start_idx + sr:
                    data = data[start_idx:end_idx]
            else:
                win_transcript = None
                max_samples = int(sr * 9.5)
                if len(data) > max_samples:
                    data = data[:max_samples]

            trimmed_path = f"/tmp/trimmed_{hashlib.md5(prompt_path.encode('utf-8')).hexdigest()}.wav"
            sf.write(trimmed_path, data, sr, format='WAV')
            self.trimmed_prompt_cache[prompt_path] = (trimmed_path, win_transcript)
            return trimmed_path, win_transcript
        except Exception as e:
            print(f"⚠️ Erreur découpage prompt {prompt_path}: {e}")
            return prompt_path, (matched_window[2] if matched_window else None)

    def _get_chatterbox_conditionals(self, prompt_path: str, exaggeration: float = 0.55):
        """Pré-calcule et met en cache GPU les embeddings vocaux Chatterbox Multilingual pour un locuteur."""
        trimmed_path, _ = self._get_trimmed_prompt_wav(prompt_path)
        cache_key = f"{trimmed_path}::{exaggeration:.2f}"
        if cache_key not in self.chatterbox_cond_cache:
            t0 = time.time()
            self.chatterbox_model.prepare_conditionals(
                wav_fpath=trimmed_path,
                exaggeration=exaggeration
            )
            self.chatterbox_cond_cache[cache_key] = copy.deepcopy(self.chatterbox_model.conds)
            print(f"🎙️ [Chatterbox] Empreinte vocale extraite et cachée ({trimmed_path}, exag={exaggeration:.2f}) en {time.time() - t0:.2f}s")
        else:
            self.chatterbox_model.conds = copy.deepcopy(self.chatterbox_cond_cache[cache_key])

    def _synthesize_block_chatterbox(
        self,
        text: str,
        prompt_path: str,
        language_id: str = "fr",
        sentence_pause_sec: float = 0.16,
        exaggeration: float = 0.55,
        cfg_weight: float = 0.50,
        temperature: float = 0.75,
    ) -> Tuple[np.ndarray, int]:
        """Synthétise un paragraphe en français avec Chatterbox Multilingual + modulation expressive + fondu cosinus doux."""
        self._get_chatterbox_conditionals(prompt_path, exaggeration=exaggeration)
        sr = self.chatterbox_model.sr

        raw_sentences = split_into_clean_sentences(text, max_sentence_chars=230)
        if not raw_sentences:
            raw_sentences = [normalize_french_narrative_text(text) or text.strip()]

        sentence_wavs = []
        for s_idx, sent in enumerate(raw_sentences):
            if not sent:
                continue
            wav_tensor = self.chatterbox_model.generate(
                text=sent,
                language_id=language_id,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
            )
            if hasattr(wav_tensor, "cpu"):
                w_np = wav_tensor.squeeze().cpu().numpy().astype(np.float32)
            else:
                w_np = np.array(wav_tensor, dtype=np.float32).squeeze()

            w_np = _apply_cosine_edges(w_np, sr=sr, fade_in_ms=12.0, fade_out_ms=18.0)
            sentence_wavs.append(w_np)

            if s_idx < len(raw_sentences) - 1 and sentence_pause_sec > 0:
                sentence_wavs.append(np.zeros(int(sr * sentence_pause_sec), dtype=np.float32))

        if not sentence_wavs:
            return np.zeros(int(sr * 0.1), dtype=np.float32), sr
        return np.concatenate(sentence_wavs), sr

    def _get_speaker_conditioning(self, prompt_path: str, prompt_text: str = "") -> dict:
        """Extrait et met en cache les tenseurs d'empreinte vocale complète pour CosyVoice 2 EU
        SANS le normaliseur anglais (text_frontend=False)."""
        trimmed_path, win_transcript = self._get_trimmed_prompt_wav(prompt_path)
        resolved_prompt = win_transcript if win_transcript else (prompt_text.strip() if prompt_text else "")
        resolved_prompt = normalize_french_narrative_text(resolved_prompt)

        cache_key = f"{trimmed_path}::{resolved_prompt}"
        if cache_key in self.speaker_cache:
            return self.speaker_cache[cache_key]

        from cosyvoice.utils.file_utils import load_wav
        t_spk = time.time()
        frontend = self.cosy_model._model.frontend
        sample_rate = self.cosy_model._model.sample_rate
        prompt_speech_16k = load_wav(trimmed_path, 16000)

        if not win_transcript and resolved_prompt:
            sents = re.split(r'(?<=[.!?])\s+', resolved_prompt)
            if len(sents) >= 2:
                resolved_prompt = " ".join(sents[:2]).strip()

        if resolved_prompt:
            # IMPORTANT : Ne jamais appeler frontend.text_normalize(..., text_frontend=True) qui est en anglais !
            base_input = frontend.frontend_zero_shot('Bonjour.', resolved_prompt, prompt_speech_16k, sample_rate, '')
            mode_label = "zero_shot_fr_pure"
        else:
            base_input = frontend.frontend_cross_lingual('Bonjour.', prompt_speech_16k, sample_rate, '')
            mode_label = "cross_lingual"

        base_input.pop('text', None)
        base_input.pop('text_len', None)
        self.speaker_cache[cache_key] = base_input
        print(f"🎙️ [CosyVoice2-EU] Empreinte vocale [{mode_label}] extraite ({trimmed_path}) en {time.time() - t_spk:.2f}s")
        return base_input

    def _synthesize_block_fast(self, text: str, prompt_path: str, prompt_text: str = "", sentence_pause_sec: float = 0.16) -> Tuple[np.ndarray, int]:
        """Synthétise un bloc narratif phrase par phrase avec CosyVoice 2 EU (SANS en_tn_model anglais,
        avec normalisation narrative française et fondu cosinus aux jonctions)."""
        frontend = self.cosy_model._model.frontend
        model = self.cosy_model._model.model
        sr = self.cosy_model.sample_rate
        spk_cond = self._get_speaker_conditioning(prompt_path, prompt_text=prompt_text)

        raw_sentences = split_into_clean_sentences(text, max_sentence_chars=210)
        if not raw_sentences:
            raw_sentences = [normalize_french_narrative_text(text) or text.strip()]

        sentence_wavs = []
        for s_idx, clean_sent in enumerate(raw_sentences):
            if not clean_sent:
                continue
            tts_text_token, tts_text_token_len = frontend._extract_text_token(clean_sent)
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
                w_np = _apply_cosine_edges(w_np, sr=sr, fade_in_ms=12.0, fade_out_ms=18.0)
                sentence_wavs.append(w_np)

            # Légère respiration naturelle entre deux phrases d'un même paragraphe
            if s_idx < len(raw_sentences) - 1 and sentence_pause_sec > 0:
                sentence_wavs.append(np.zeros(int(sr * sentence_pause_sec), dtype=np.float32))

        if not sentence_wavs:
            return np.zeros(int(sr * 0.1), dtype=np.float32), sr
        return np.concatenate(sentence_wavs), sr

    def _synthesize_block_auto(
        self,
        text: str,
        prompt_path: str,
        prompt_text: str = "",
        sentence_pause_sec: float = 0.16,
        language: str = "fr",
        prefer_engine: Optional[str] = None,
        exaggeration: float = 0.55,
        cfg_weight: float = 0.50,
        temperature: float = 0.75,
    ) -> Tuple[np.ndarray, int]:
        """Route automatiquement vers Chatterbox Multilingual (par défaut) ou CosyVoice2-EU corrigé avec paramètres expressifs."""
        target_engine = (prefer_engine or self.engine or "chatterbox").lower()
        if "chatterbox" in target_engine and self.chatterbox_model is not None:
            try:
                lang_code = (language or "fr").lower()[:2]
                return self._synthesize_block_chatterbox(
                    text=text,
                    prompt_path=prompt_path,
                    language_id=lang_code,
                    sentence_pause_sec=sentence_pause_sec,
                    exaggeration=exaggeration,
                    cfg_weight=cfg_weight,
                    temperature=temperature,
                )
            except Exception as cb_err:
                print(f"⚠️ [Chatterbox] Erreur sur bloc ({cb_err}), fallback immédiat sur CosyVoice2-EU corrigé...")

        return self._synthesize_block_fast(
            text=text,
            prompt_path=prompt_path,
            prompt_text=prompt_text,
            sentence_pause_sec=sentence_pause_sec,
        )

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

        paragraph_pause_sec = request.paragraph_pause_ms / 1000.0 if request.paragraph_pause_ms is not None else 0.85
        sentence_pause_sec = request.sentence_pause_ms / 1000.0 if request.sentence_pause_ms is not None else 0.16
        global_instruct = request.instruct.strip() if request.instruct and request.instruct.strip() else None

        text_chunks = chunk_text_optimized(
            request.text, 
            max_chars=400,
            paragraph_pause_sec=paragraph_pause_sec,
            default_instruct=global_instruct,
            enable_sleep_pacing=bool(request.enable_sleep_pacing)
        )

        clean_prompt = request.ref_text.strip() if request.ref_text else ""
        active_engine = request.provider if (request.provider and request.provider in ["chatterbox", "cosyvoice2"]) else self.engine

        print(f"⚡ [{req_id}] Synthèse vocale [{active_engine.upper()}] de la voix ({ref_audio_path}) sur {len(text_chunks)} blocs...")
        start_inf = time.time()
        generated_wavs = []
        sr = 24000

        with torch.inference_mode():
            if request.isMultiVoice and request.segments and len(request.segments) > 0:
                print(f"🎭 [{req_id}] Théâtre Audio Multi-Voix détecté ({len(request.segments)} répliques/segments bruts) !")
                
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

                    if idx == 0:
                        seg_pause = 0.0
                    elif seg_speaker_key == previous_speaker:
                        seg_pause = 0.22
                    else:
                        seg_pause = 0.45

                    previous_speaker = seg_speaker_key

                    prompt_target = seg_ref_path if (seg_ref_path and os.path.exists(seg_ref_path)) else DEFAULT_LOCAL_REF
                    seg_prompt_text = (seg.get("ref_text") or seg.get("transcript") or (clean_prompt if seg_ref_path == ref_audio_path else "") or "").strip()

                    # Calcul de la dynamique expressive
                    is_dialogue = seg.get("speakerType") == "dialogue" or seg.get("roleCategory") != "narrator_family"
                    seg_emotion = seg.get("emotion")
                    prog = (idx / float(len(merged_segments) - 1)) if len(merged_segments) > 1 else 0.0
                    exag, cfg_w, temp = resolve_speech_prosody_params(
                        text=seg_text,
                        explicit_emotion=seg_emotion,
                        is_dialogue=is_dialogue,
                        progress=prog,
                        enable_sleep_pacing=bool(request.enable_sleep_pacing),
                    )

                    wav_np, current_sr = self._synthesize_block_auto(
                        text=seg_text,
                        prompt_path=prompt_target,
                        prompt_text=seg_prompt_text,
                        sentence_pause_sec=sentence_pause_sec,
                        language=request.language,
                        prefer_engine=active_engine,
                        exaggeration=exag,
                        cfg_weight=cfg_w,
                        temperature=temp,
                    )
                    sr = current_sr

                    if seg_pause > 0:
                        pause_samples = int(sr * seg_pause)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    speaker_label = seg.get("speakerName") or seg.get("roleCategory") or "Narrateur"
                    print(f"  ├─ [Théâtre/{active_engine}] Segment {idx+1}/{len(merged_segments)} ({speaker_label}, exag={exag}, emo={seg_emotion or 'auto'}): {len(seg_text)} chars généré en {time.time() - t0:.2f}s")

            else:
                prompt_target = ref_audio_path if (ref_audio_path and os.path.exists(ref_audio_path)) else DEFAULT_LOCAL_REF
                for idx, chunk_data in enumerate(text_chunks):
                    chunk, pause_before, chunk_emo, chunk_instruct = chunk_data
                    t0 = time.time()

                    prog = (idx / float(len(text_chunks) - 1)) if len(text_chunks) > 1 else 0.0
                    exag, cfg_w, temp = resolve_speech_prosody_params(
                        text=chunk,
                        explicit_emotion=chunk_emo,
                        is_dialogue=False,
                        progress=prog,
                        enable_sleep_pacing=bool(request.enable_sleep_pacing),
                    )

                    wav_np, current_sr = self._synthesize_block_auto(
                        text=chunk,
                        prompt_path=prompt_target,
                        prompt_text=clean_prompt,
                        sentence_pause_sec=sentence_pause_sec,
                        language=request.language,
                        prefer_engine=active_engine,
                        exaggeration=exag,
                        cfg_weight=cfg_w,
                        temperature=temp,
                    )
                    sr = current_sr

                    if pause_before > 0:
                        pause_samples = int(sr * pause_before)
                        silence = np.zeros(pause_samples, dtype=np.float32)
                        generated_wavs.append(silence)

                    generated_wavs.append(wav_np)
                    print(f"  ├─ [{active_engine.upper()}] Paragraphe {idx+1}/{len(text_chunks)} (exag={exag}, emo={chunk_emo or 'auto'}, {len(chunk)} chars) généré en {time.time() - t0:.2f}s")

        final_wav = np.concatenate(generated_wavs)
        total_time = time.time() - start_inf
        print(f"🎉 [{req_id}] Synthèse GPU [{active_engine.upper()}] terminée en {total_time:.2f}s !")

        out_buf = io.BytesIO()
        sf.write(out_buf, final_wav, sr, format='WAV')
        out_buf.seek(0)
        
        # Mastering EBU R128 (-16 LUFS) Close-Mic Studio
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
