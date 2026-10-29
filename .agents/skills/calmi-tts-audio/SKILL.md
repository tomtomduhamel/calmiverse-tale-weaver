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

### B. Haute Vitesse par Cache GPU de l'Empreinte Vocale (`self.speaker_cache`)
- **Diagnostic** : L'appel standard `cosy_model.tts(text, prompt)` ré-exécute `load_wav` + ONNX Whisper (`speech_tokenizer_v2.onnx`) + ONNX CampPlus (`campplus.onnx`) à chaque phrase (~3,5 s d'overhead fixe perdues par phrase). De plus, `frontend_cross_lingual` dans `cosyvoice` supprime des clés (`del model_input['prompt_text']`) par effet de bord dans `spk2info`, provoquant un `KeyError` au 2e appel si `zero_shot_spk_id` est utilisé directement.
- **Implémentation obligatoire** :
  1. Extraire l'empreinte vocale **une seule fois par voix** via `_get_speaker_conditioning(prompt_path)` (en plafonnant l'audio de référence à `8 secondes` = `16000 * 8` échantillons) et la stocker dans `self.speaker_cache[prompt_path]`.
  2. Pré-chauffer `/root/default_ref.wav` dès `@modal.enter() def setup(self)`.
  3. Pour chaque phrase normalisée, cloner le dictionnaire mis en cache (`{**spk_cond, 'text': tts_text_token, 'text_len': tts_text_token_len}`) et appeler directement `self.cosy_model._model.model.tts(**model_input, stream=False, speed=1.0)`.

### C. Fast-Gateway Asynchrone & Intégrité des Fichiers
- **Endpoint unique de production** : `https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run` (conteneur CPU qui répond `HTTP 202` en `< 500 ms` et lance `CalmiTTSGPU().process_async_task.spawn(...)`).
- **Interdiction d'upload partiel** : Ne jamais téléverser un « Chunk 0 » de 18 secondes avec `status = 'ready'` sur l'enregistrement `audio_files`, sous peine d'empoisonner définitivement le cache IndexedDB du client avec un fichier tronqué.
- **Déploiement** :
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"; uv run --with modal --with pydantic --with fastapi --with numpy --with soundfile modal deploy vps-tts-service/modal_app.py
  ```

---

## 2. Lecteur Audio (`src/components/story/reader/IntegratedAudioDeck.tsx`)

### A. Synchronisation Play/Pause & MediaSession Android/iOS
1. En tête de `handlePlayPause`, toujours inspecter l'état natif réel du DOM :
   ```ts
   const isNativeAudioPlaying = Boolean(
     audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.currentTime > 0
   );
   if ((isPlaying || isNativeAudioPlaying) && audioRef.current && readyStoryAudioFile?.audio_url) {
     audioRef.current.pause();
     setIsPlaying(false);
     isStartingPlaybackRef.current = false;
     return;
   }
   ```
2. Toujours attacher `audio.onplay = () => setIsPlaying(true)` et `audio.onpause = () => { if (!audio.ended) setIsPlaying(false); }` sur `audioRef.current`.
3. Utiliser le verrou `isStartingPlaybackRef` pendant la résolution asynchrone (`audioCache.get()`, `getSignedAudioUrl()`) pour éviter tout double lancement concurrent.

### B. Responsive Mobile de la Capsule Flottante (320px–430px)
1. Ne jamais utiliser de classes Tailwind inexistantes (`h-8.5`, `w-8.5`, `h-13`) sur un `Button size="icon"`, car elles sont ignorées et laissent le bouton à `40x40px` (`h-10 w-10`), faisant déborder les icônes de droite.
2. Utiliser `h-[52px]`, `h-8 w-8 sm:h-9 sm:w-9`, `min-w-0 flex-shrink` sur le sélecteur de narrateur à gauche, et `shrink-0` sur les contrôles centraux et les icônes de droite (`✓` et `🌙`).
