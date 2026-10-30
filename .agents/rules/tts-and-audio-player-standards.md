# Standards TTS CosyVoice 2, Cache Audio & Lecteur Mobile - Calmiverse (v2.0)

Ce document consigne les règles critiques d'ingénierie apprises lors de la résolution des problèmes de synthèse vocale (« langue des Minions » / effondrement d'attention), de timeouts HTTP, de synchronisation MediaSession Android et de responsive mobile sur le lecteur `IntegratedAudioDeck`.

---

## 1. Moteur TTS CosyVoice 2 (`vps-tts-service/modal_app.py`)

### Règle n°1 : Fenêtre d'attention stricte (≤ 200 caractères par passe LLM) & `text_frontend=True`
- **Problème identifié (« Langue des Minions » / Babillage)** :
  - Dans `cosyvoice2-eu`, la méthode `Cosy2EU.tts(text, prompt, speed=1.0, text_frontend=False)` désactive par défaut `text_frontend`.
  - Lorsque `text_frontend=False`, `CosyVoiceFrontEnd.text_normalize()` court-circuite complètement la normalisation linguistique française et le découpage en phrases (`token_max_n=80`).
  - Le modèle `CosyVoice2-0.5B-EU` (`Qwen2LM` unistream) possède un horizon d'attention strict d'environ **60 à 80 tokens par passe** (~180 à 220 caractères). Si on lui injecte un bloc brut de 400 à 1 100 caractères d'un seul tenant, sa matrice d'attention s'effondre : il saute des phrases ou génère un charabia pseudo-français (*« Il au poujeur, dédé podeu de deux... »*).
- **Règle absolue** :
  1. **Ne jamais envoyer un paragraphe entier (> 220 caractères) en une seule passe au LLM de CosyVoice 2.**
  2. Toujours découper chaque paragraphe en phrases courtes et naturelles (`split_into_clean_sentences`, `max_sentence_chars=200`) et activer `frontend.text_normalize(sent, split=True, text_frontend=True)` pour convertir les nombres/symboles en français et garantir `< 80` tokens par segment.

### Règle n°2 : Clonage Vocal Zero-Shot Fidèle (`frontend_zero_shot`) & Cache GPU (`self.speaker_cache`)
- **Problème identifié (Lenteur de `cosy_model.tts()` et perte du timbre vocal avec `frontend_cross_lingual`)** :
  - L'appel naïf à `cosy_model.tts(text, prompt)` recharge le fichier WAV à 16 kHz et ré-exécute deux modèles ONNX lourds (`speech_tokenizer_v2.onnx` Whisper + `campplus.onnx`) ainsi que l'extraction Mel à **chaque phrase** (~3,5 secondes d'overhead fixe perdues par phrase, soit > 3 minutes perdues sur 60 phrases).
  - `frontend_cross_lingual` dans `cosyvoice` supprime `llm_prompt_speech_token` et `prompt_text`, privant le LLM Qwen2.5 des tokens acoustiques du locuteur de référence (la voix générée devient alors générique au lieu de reproduire le vrai timbre du clone vocal).
  - De plus, tronquer l'audio de référence à 8 s alors que la transcription (`ref_text` / `transcript`) couvre l'enregistrement complet (~15 s) désaligne les tokens texte et audio dans `frontend_zero_shot`.
- **Règle absolue** :
  1. Persister systématiquement les voix converties dans `/cache/voices_cache` avec `volume.commit()`.
  2. Dans `_get_speaker_conditioning(prompt_path, prompt_text)`, conserver l'audio de référence complet (jusqu'à 25 s) lorsqu'une transcription (`prompt_text` / `transcript`) est connue, normaliser la transcription via `frontend.text_normalize(resolved_prompt, split=False, text_frontend=True)`, et utiliser **`frontend.frontend_zero_shot('', norm_prompt, prompt_speech_16k, sample_rate, '')`** pour préserver `llm_prompt_speech_token` et `prompt_text`.
  3. Mettre en cache le dictionnaire résultant dans `self.speaker_cache[f"{prompt_path}::{resolved_prompt}"]` et cloner superficiellement le dictionnaire (`{**spk_cond, 'text': tts_text_token, 'text_len': tts_text_token_len}`) à chaque phrase.
  4. **Interdiction du « Chunk 0 Fast-Play » partiel** : Ne jamais téléverser un premier fragment de 18 secondes sur la même ligne `audio_files` avec `status = 'ready'`, car le frontend met immédiatement ce fragment en cache IndexedDB et l'utilisateur n'entend que 18 secondes d'histoire.

### Règle n°3 : Architecture Fast-Gateway Asynchrone (< 500 ms)
- Toutes les requêtes TTS (`get-tts-config`) doivent cibler le **CPU Fast-Gateway** (`synthesize_async_fast`), qui répond `HTTP 202 Accepted` en `< 500 ms` et délègue par `.spawn()` au worker GPU `CalmiTTSGPU.process_async_task`, éliminant définitivement les timeouts de cold-start GPU et de passerelle n8n/Supabase.

---

## 2. Lecteur Audio (`IntegratedAudioDeck.tsx`) & Synchronisation Mobile

### Règle n°4 : Singleton `globalStoryAudio`, Coupe-Circuit Total (`stopAllPlayback`) & Neutralisation de `utterance.onend` sur Android
- **Problèmes identifiés** :
  1. **Instance `Audio` orpheline** : Créer `new Audio()` dans un `useRef` local après des appels `await` (`audioCache.get()`, `getSignedAudioUrl()`) laisse tourner une instance `Audio` orpheline en arrière-plan (dans la `MediaSession` Android) si le composant se re-rend ou si `readyStoryAudioFile` change pendant le chargement.
  2. **Bug `speechSynthesis.cancel()` sur Android** : Sur Android Chrome/WebView, appeler `window.speechSynthesis.cancel()` déclenche `utterance.onend`. Sans garde `browserSpeechCancelledRef.current = true` ni détachement préalable de `utterance.onend = null`, le callback `onend` relance immédiatement la phrase suivante (`playBrowserParagraph(index + 1)`), empêchant toute mise en pause du texte et de la voix !
  3. **Transition `speechSynthesis` → `readyStoryAudioFile`** : Si l'utilisateur lance la lecture pendant les premières millisecondes avant que `readyStoryAudioFile` soit chargé, puis appuie sur Pause une fois `readyStoryAudioFile` chargé, vérifier `if (audioRef.current && readyStoryAudioFile)` échoue (car `audioRef.current` était nul) et lance le fichier WAV par-dessus la synthèse vocale au lieu de mettre en pause !
- **Règle absolue** :
  1. Utiliser un singleton module-level `globalStoryAudio`.
  2. En tête de `handlePlayPause`, vérifier de manière inconditionnelle `if (isPlaying || isNativeAudioPlaying || isSpeechSynthActive || isStartingPlaybackRef.current)` et appeler `stopAllPlayback()` immédiatement.
  3. Dans `stopAllPlayback()`, incrémenter `playbackSessionIdRef.current`, détacher `utteranceRef.current.onend = null` et activer `browserSpeechCancelledRef.current = true` avant `speechSynthesis.cancel()`, mettre en pause `globalStoryAudio`, toutes les balises `<audio>` du DOM, `backgroundSound` et `onPauseScroll()`.

### Règle n°5 : Classes Tailwind Valides & Flexbox Mobile sur la Capsule Flottante
- **Problème identifié** :
  - L'utilisation de classes non définies dans l'échelle Tailwind par défaut (`h-8.5`, `w-8.5`, `h-13`) sur un composant `Button size="icon"` est ignorée par le CSS et laisse le bouton à sa taille par défaut (`h-10 w-10` = 40px), provoquant une troncature des icônes de droite (`✓` et `🌙`) sur les écrans mobiles de 320px–375px.
- **Règle absolue** :
  1. Utiliser exclusivement des classes d'espacement Tailwind standards (`h-8 w-8 sm:h-9 sm:w-9`) ou des valeurs arbitraires explicites (`h-[52px]`).
  2. Appliquer `min-w-0 flex-shrink` sur le sélecteur de voix à gauche avec une troncature adaptative (`max-w-[68px] xs:max-w-[85px] sm:max-w-[130px] truncate`) et `shrink-0` sur les contrôles centraux et les icônes de droite.

### Règle n°6 : Versionnement et Validation de Taille du Cache Audio IndexedDB (`audioCache.ts`)
- La clé de cache IndexedDB doit toujours inclure le nom de fichier unique généré (`getAudioCacheKey(storyId, audioUrl)`).
- Toute lecture ou écriture dans `audioCache` doit vérifier que `blob.size` est cohérent avec `expectedSize` (≥ 90 %) et supérieur à 1 024 octets afin d'auto-purger tout fichier tronqué ou corrompu.
