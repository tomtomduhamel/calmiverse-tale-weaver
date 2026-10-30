---
name: calmi-tts-audio
description: Architecture, règles d'inférence CosyVoice 2 sur Modal GPU, gestion du cache audio IndexedDB et synchronisation mobile du lecteur IntegratedAudioDeck pour Calmi. ACTIVER ce skill pour toute modification ou tout diagnostic touchant à la synthèse vocale (TTS), au clonage de voix, au lecteur audio ou au cache hors-ligne.
---

# Skill : Architecture TTS CosyVoice 2 & Lecteur Audio Mobile (Calmi)

Ce skill regroupe les règles d'or et procédures opérationnelles pour maintenir une synthèse vocale française limpide, rapide et sans timeout, ainsi qu'un lecteur mobile (`IntegratedAudioDeck.tsx`) parfaitement synchronisé avec l'OS (Android/iOS).

---

## 1. Moteur TTS Modal GPU (`vps-tts-service/modal_app.py`)

### A. Prévention du bug « Langue des Minions » (Effondrement d'attention de CosyVoice 2)
- **Diagnostic** : `CosyVoice2-0.5B-EU` (`cosyvoice2-eu`) possède une fenêtre d'attention maximale de **~60 à 80 tokens par passe LLM** (~180 à 220 caractères). De plus, `Cosy2EU.tts()` passe `text_frontend=False` par défaut, ce qui désactive la normalisation française et le découpage en phrases. Si un bloc > 250 caractères est envoyé d'un seul tenant avec `text_frontend=False`, la matrice d'attention s'effondre et le modèle génère des syllabes françaises inventées.
- **Implémentation obligatoire** :
  1. Toujours découper chaque paragraphe en phrases courtes (`split_into_clean_sentences`, `max_sentence_chars=200`).
  2. Passer chaque phrase par `frontend.text_normalize(sent, split=True, text_frontend=True)` pour normaliser les nombres/abréviations en français et garantir `< 80` tokens.
  3. Insérer une micro-respiration (`sentence_pause_sec = 0.18s` à `0.20s`) entre les phrases d'un même paragraphe, et conserver le `Sleep Pacing` (`1.0s` → `1.5s` → `2.5s`) entre les paragraphes.

### B. Clonage Vocal Fidèle (`frontend_zero_shot`) & Cache GPU (`self.speaker_cache`)
- **Diagnostic** :
  1. `frontend_cross_lingual` dans `cosyvoice` supprime `llm_prompt_speech_token` et `prompt_text`, privant le LLM Qwen2.5 des tokens acoustiques du locuteur de référence (le résultat ressemble alors à une voix générique au lieu du clone vocal familial).
  2. Tronquer l'audio de référence à 8 s alors que la transcription (`ref_text` / `transcript`) couvre l'enregistrement complet (~15 s) désaligne les tokens texte et audio dans `frontend_zero_shot`.
  3. Sur Modal, tout fichier écrit dans `/cache/voices_cache` sans `volume.commit()` est perdu au prochain conteneur.
- **Implémentation obligatoire** :
  1. Toujours appeler `volume.commit()` dans `download_and_cache_voice()` après conversion FFmpeg d'une voix de référence.
  2. Dans `_get_speaker_conditioning(prompt_path, prompt_text)`, conserver l'enregistrement de référence complet (jusqu'à 25 s) lorsqu'une transcription (`prompt_text` / `transcript`) est disponible, normaliser la transcription via `frontend.text_normalize(resolved_prompt, split=False, text_frontend=True)`, et utiliser **`frontend.frontend_zero_shot('', norm_prompt, prompt_speech_16k, sample_rate, '')`** pour préserver `llm_prompt_speech_token`.
  3. Mettre en cache le dictionnaire résultant dans `self.speaker_cache[f"{prompt_path}::{resolved_prompt}"]` pour éliminer 100 % de l'overhead ONNX inter-phrases.
  4. Toujours propager `voiceRefPath` et `transcript` (`ref_text`) dans chaque segment de `storyAudioParser.ts`.

### C. Fast-Gateway Asynchrone & Intégrité des Fichiers
- **Endpoint unique de production** : `https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run` (conteneur CPU qui répond `HTTP 202` en `< 500 ms` et lance `CalmiTTSGPU().process_async_task.spawn(...)`).
- **Interdiction d'upload partiel** : Ne jamais téléverser un « Chunk 0 » de 18 secondes avec `status = 'ready'` sur l'enregistrement `audio_files`, sous peine d'empoisonner définitivement le cache IndexedDB du client avec un fichier tronqué.
- **Déploiement Windows (UTF-8 obligatoire pour éviter `UnicodeEncodeError` sur `\u2713`)** :
  Exécuter `modal deploy vps-tts-service/modal_app.py` avec `PYTHONIOENCODING="utf-8"` et `PYTHONUTF8="1"`.

---

## 2. Lecteur Audio (`src/components/story/reader/IntegratedAudioDeck.tsx`)

### A. Singleton Audio Global & Coupe-Circuit Total (`stopAllPlayback`)
1. **Singleton `globalStoryAudio` au niveau module** : Ne jamais instancier `new Audio()` uniquement dans un `useRef` local après des appels `await`, sous peine de créer des instances `Audio` orphelines lors des re-renders ou démontages.
2. **Neutralisation de `utterance.onend` sur Android** : Sur Android Chrome/WebView, appeler `window.speechSynthesis.cancel()` déclenche l'événement `utterance.onend`. Si `onend` n'est pas neutralisé par un drapeau `browserSpeechCancelledRef.current = true` et `utteranceRef.current.onend = null` avant `cancel()`, `onend` relance immédiatement la phrase suivante (`playBrowserParagraph(index + 1)`), rendant la mise en pause impossible.
3. **Coupe-circuit universel en tête de `handlePlayPause`** :
   Dès que `isPlaying || isNativeAudioPlaying || isSpeechSynthActive || isStartingPlaybackRef.current` est vrai (indépendamment de `readyStoryAudioFile` ou `currentTime`), appeler immédiatement `stopAllPlayback()` qui :
   - invalide tout chargement asynchrone en vol via `playbackSessionIdRef.current += 1`,
   - coupe `window.speechSynthesis.cancel()` en ayant détaché `utterance.onend`,
   - met en pause `globalStoryAudio` ainsi que tous les éléments `<audio>` du DOM,
   - met en pause `backgroundSound` (s'il avait été lancé automatiquement par le ducking) et `onPauseScroll()`,
   - synchronise `navigator.mediaSession.playbackState = 'paused'`.

### B. Responsive Mobile de la Capsule Flottante (320px–430px)
1. Ne jamais utiliser de classes Tailwind inexistantes (`h-8.5`, `w-8.5`, `h-13`) sur un `Button size="icon"`, car elles sont ignorées et laissent le bouton à `40x40px` (`h-10 w-10`), faisant déborder les icônes de droite.
2. Utiliser `h-[52px]`, `h-8 w-8 sm:h-9 sm:w-9`, `min-w-0 flex-shrink` sur le sélecteur de narrateur à gauche, et `shrink-0` sur les contrôles centraux et les icônes de droite (`✓` et `🌙`).
