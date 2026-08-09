import re
from typing import List, Tuple, Optional

EMOTION_MAP = {
    "warm": "Warm, soothing, gentle bedtime narrator for children.",
    "whisper": "Soft, gentle whispering voice, quiet bedtime narrator.",
    "excited": "Enthusiastic, cheerful, joyful storytelling voice for children.",
    "mysterious": "Curious, gentle, mysterious bedtime storytelling voice.",
    "calm": "Calm, peaceful, relaxed storytelling voice.",
    "sleepy": "Very slow, soft, sleepy bedtime voice."
}

def chunk_text(
    text: str, 
    max_chars: int = 500,
    sentence_pause_sec: float = 0.25,
    paragraph_pause_sec: float = 1.0,
    chapter_pause_sec: float = 3.0,
    default_instruct: Optional[str] = None,
    enable_sleep_pacing: bool = True
) -> List[Tuple[str, float, Optional[str]]]:
    if not text or not text.strip():
        return []

    # Séparer par paragraphes (double retour à la ligne ou plus)
    raw_paragraphs = re.split(r'(?:\r?\n\s*){2,}', text.strip())
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]

    total_paras = len(paragraphs)
    chunks_with_pauses = []
    
    # Regex pour détecter les chapitres/sections
    chapter_pattern = r'^\s*(?:#+\s*|#*\s*(?:chapitre|partie|épisode|prologue|épilogue|introduction|conclusion)\b)'
    
    # Regex pour détecter les balises d'émotion ou d'instruct au tout début d'un paragraphe/chunk
    tag_pattern = r'^\s*\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]'

    current_instruct = default_instruct

    for idx, para in enumerate(paragraphs):
        # Progression dans l'histoire (de 0.0 au début à 1.0 à la fin)
        progress = (idx / float(total_paras - 1)) if total_paras > 1 else 0.0

        # 1. Extraction et mise à jour éventuelle de l'émotion pour ce paragraphe
        match_tag = re.search(tag_pattern, para, re.IGNORECASE)
        if match_tag:
            tag_val = match_tag.group(1).strip()
            if tag_val.lower().startswith("instruct:"):
                current_instruct = tag_val[len("instruct:"):].strip()
            else:
                current_instruct = EMOTION_MAP.get(tag_val.lower(), default_instruct)

        # Nettoyer toutes les balises [...] du paragraphe pour la détection et la synthèse
        para_clean_for_detect = re.sub(r'\[.*?\]', '', para).strip()
        
        # 2. Déterminer la pause avant ce paragraphe (si ce n'est pas le premier)
        if idx == 0:
            pause_before = 0.0
        else:
            if re.match(chapter_pattern, para_clean_for_detect, re.IGNORECASE):
                pause_before = chapter_pause_sec
            else:
                # Échelle progressive du Sleep Pacing pour les paragraphes ordinaires
                if enable_sleep_pacing:
                    if progress < 0.33:
                        pause_before = paragraph_pause_sec
                    elif progress < 0.66:
                        pause_before = paragraph_pause_sec * 1.5
                    else:
                        pause_before = paragraph_pause_sec * 2.5
                else:
                    pause_before = paragraph_pause_sec
        
        # 3. Ajustement du Sleep Pacing sur l'instruction vocale dans le dernier tiers de l'histoire
        final_chunk_instruct = current_instruct
        if enable_sleep_pacing and progress >= 0.66:
            sleep_suffix = ", very slow, soft, sleepy bedtime pace"
            if final_chunk_instruct:
                if sleep_suffix not in final_chunk_instruct:
                    final_chunk_instruct = final_chunk_instruct + sleep_suffix
            else:
                final_chunk_instruct = "Very slow, soft, sleepy bedtime voice"

        # Nettoyer le paragraphe pour la synthèse
        para_for_synth = re.sub(r'\[.*?\]', '', para).strip()
        para_for_synth = re.sub(r'\s+', ' ', para_for_synth)
        
        if not para_for_synth:
            continue
            
        # 4. Découper si nécessaire selon max_chars
        if len(para_for_synth) <= max_chars:
            chunks_with_pauses.append((para_for_synth, pause_before, final_chunk_instruct))
        else:
            sentences = re.split(r'(?<=[.!?])\s+', para_for_synth)
            current_chunk = ""
            is_first_chunk_of_para = True
            
            for sentence in sentences:
                s = sentence.strip()
                if not s:
                    continue
                if len(current_chunk) + len(s) + 1 <= max_chars:
                    current_chunk = f"{current_chunk} {s}".strip()
                else:
                    if current_chunk:
                        p = pause_before if is_first_chunk_of_para else sentence_pause_sec
                        chunks_with_pauses.append((current_chunk, p, final_chunk_instruct))
                        is_first_chunk_of_para = False
                    current_chunk = s
            
            if current_chunk:
                p = pause_before if is_first_chunk_of_para else sentence_pause_sec
                chunks_with_pauses.append((current_chunk, p, final_chunk_instruct))

    return chunks_with_pauses


# --- TEST CASES ---
def run_tests():
    sample_story = """
    [warm] Paragraphe 1 : Il était une fois un petit renard nommé Barnabé.
    
    Paragraphe 2 : Il aimait se promener dans la forêt sous le soleil du matin.
    
    ## Chapitre 1 : Le Trésor
    
    Paragraphe 4 : Dans le bosquet, il trouva une carte ancienne.
    
    Paragraphe 5 : Barnabé suivit le sentier secret vers la rivière.
    
    Paragraphe 6 : Il ferma les yeux et s'endormit paisiblement sous les étoiles.
    """
    
    print("Testing chunk_text with Sleep Pacing...")
    chunks = chunk_text(sample_story, max_chars=300, default_instruct="Default narrator voice", enable_sleep_pacing=True)
    
    for idx, (chunk, pause, instruct) in enumerate(chunks):
        print(f"Chunk {idx+1} (pause: {pause}s) | Instruct: \"{instruct}\"")
        print(f"  Text: [{chunk[:60]}...]")
        print("-" * 50)
        
    # Assertions
    # Chunk 1 (progress 0/5 = 0.0) -> pause 0.0s
    assert chunks[0][1] == 0.0
    
    # Chunk 2 (progress 1/5 = 0.2 < 0.33) -> pause 1.0s
    assert chunks[1][1] == 1.0
    
    # Chunk 3 (## Chapitre 1) -> chapter pause 3.0s
    assert chunks[2][1] == 3.0
    
    # Chunk 4 (progress 3/5 = 0.6 >= 0.33 and < 0.66) -> pause 1.5s
    assert chunks[3][1] == 1.5
    
    # Chunk 5 (progress 4/5 = 0.8 >= 0.66) -> pause 2.5s and sleep_suffix added to instruct
    assert chunks[4][1] == 2.5
    assert "sleepy bedtime pace" in chunks[4][2]
    
    # Chunk 6 (progress 5/5 = 1.0 >= 0.66) -> pause 2.5s and sleep_suffix added to instruct
    assert chunks[5][1] == 2.5
    assert "sleepy bedtime pace" in chunks[5][2]

    print("\n[OK] All Sleep Pacing assertions passed successfully!")

if __name__ == "__main__":
    run_tests()
