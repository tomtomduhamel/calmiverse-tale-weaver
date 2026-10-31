---
name: calmi-tts-audio
description: Architecture, règles d'inférence Chatterbox Multilingual & CosyVoice 2 sur Modal GPU, normalisation narrative française, gestion du cache audio IndexedDB et synchronisation mobile/notifications Android du lecteur IntegratedAudioDeck pour Calmi. ACTIVER ce skill pour toute modification ou tout diagnostic touchant à la synthèse vocale (TTS), au clonage de voix, au lecteur audio ou au cache hors-ligne.
---

# Skill : Architecture TTS (Chatterbox Multilingual & CosyVoice 2-EU) & Lecteur Audio Mobile (Calmi)

Ce skill regroupe les règles d'or et procédures opérationnelles pour maintenir une synthèse vocale française limpide, vivante, naturelle et sans défaut prosodique, ainsi qu'un lecteur mobile (`IntegratedAudioDeck.tsx`) parfaitement synchronisé avec l'OS (Android/iOS, volet de notifications inclus).

---

## 1. Moteur TTS Modal GPU (`vps-tts-service/modal_app.py`)

### A. Normalisation Narrative 100 % Française & Préservation de la Ponctuation Expressive
- **Diagnostic critique** :
  1. Dans `cosyvoice`, `frontend.text_normalize(..., text_frontend=True)` exécute en réalité `en_tn_model` (le normaliseur de texte **anglais** de WeTextProcessing !) dès que le texte ne contient pas de caractères chinois. Activer `text_frontend=True` sur du français déforme les apostrophes (`l'`, `d'`, `s'`), les nombres et certains mots français.
  2. Remplacer les points d'exclamation `!` ou d'interrogation `?` par des virgules devant les incises détruisait toute l'intention et le relief émotionnel de Chatterbox (qui lit alors les répliques fortes comme de molles propositions subordonnées).
  3. Découper naïvement sur `(?<=[.!?…;])\s+` coupe **à l'intérieur** des répliques suivies d'une incise (ex: `« Je suis Cracrac ! » annonce-t-il`), laissant `annonce-t-il` isolé en début de phrase suivante.
- **Implémentation obligatoire (`normalize_french_narrative_text` + `split_into_clean_sentences`)** :
  1. **Ne jamais utiliser `text_frontend=True`**. Toujours passer par `normalize_french_narrative_text(text)` qui :
     - préserve scrupuleusement la ponctuation expressive (`!`, `?`, `…`) devant les incises (`([!?…])\s*»\s*,?\s*([a-zà-ÿ])` $\rightarrow$ `\1 \2`),
     - supprime les guillemets `«` et `»` ainsi que les tirets de début de réplique `—`,
     - convertit les `;` en `.` (devant majuscule) ou `,` (devant minuscule),
     - convertit les nombres (`0..9999`) en toutes lettres en **français** (`_int_to_french`),
     - supprime l'espace typographique français devant `, ! ? : .`.
  2. Dans `split_into_clean_sentences`, ne couper après `[.!?…]` **que si le caractère suivant est une majuscule** (`(?<=[.!?…])\s+(?=[A-ZÀ-Ÿ])`), afin de ne jamais séparer une citation de son verbe d'incise en minuscule (`annonce-t-il`, `murmure-t-il`, `répond Joseph`).
  3. Appliquer systématiquement un **fondu cosinus doux (`_apply_cosine_edges`, 12 ms fade-in / 18 ms fade-out)** sur chaque phrase synthétisée avant concaténation pour éliminer tout clic de phase aux transitions.

### B. Préservation du Timbre Vocal, Traitement Anti-Boîte & Voix Studio « En Avant »
- **Diagnostic** :
  1. Les modèles de clonage zero-shot apprennent l'acoustique de la pièce de l'enregistrement de référence (réflexions murales, micro distant). Sans traitement, cette réverbe est clonée sur chaque syllabe.
  2. L'effet « boîte de conserve » provient d'une résonance creuse dans les bas-médiums (350–500 Hz) et d'un manque de présence dans les médiums-aigus (3–5 kHz).
  3. Un compresseur `loudnorm` avec une plage trop large (LRA=11) pompe et amplifie le bruit de fond et l'écho entre les mots.
- **Implémentation obligatoire** :
  1. Dans `convert_to_wav` : appliquer `highpass=f=65,equalizer=f=420:width_type=q:w=1.4:g=-3.5,agate=range=0.06:threshold=0.03:ratio=2:attack=20:release=140` avec le préfixe de cache `voice_studio_v3_` et `volume.commit()`.
  2. Découper l'enregistrement de référence sur sa fenêtre optimale (`_get_trimmed_prompt_wav`, ex: `0.35s` à `7.60s` pour la voix `Papa`).
  3. Dans `master_audio_bytes` : chaîne Close-Mic Studio :
     - Coupe bas 60 Hz (`highpass=f=60`)
     - Dé-boxage chirurgical à 450 Hz (`equalizer=f=450:width_type=q:w=1.2:g=-3.0`)
     - Boost de présence studio à 3.8 kHz (`equalizer=f=3800:width_type=q:w=1.0:g=+2.5`)
     - Air soyeux à 9.5 kHz (`treble=g=+1.5:f=9500`)
     - Expander feutré (`agate=range=0.05:threshold=0.02:ratio=2:attack=15:release=120`) pour couper court à toute traîne d'écho
     - Loudnorm EBU R128 contrôlé (`loudnorm=I=-16:TP=-1.5:LRA=8:dual_mono=true`).

### C. Modulation Dynamique de l'Expressivité & Surjeu Conte d'Enfants (`resolve_speech_prosody_params`)
- **Diagnostic** :
  Figer `exaggeration=0.35` et `temperature=0.65` produisait une lecture atone, robotique et sans émotion, inadaptée aux contes animés.
- **Implémentation obligatoire** :
  1. Utiliser `resolve_speech_prosody_params` pour adapter dynamiquement :
     - **Joie / Fête / Excitation** : `exaggeration = 0.80`, `temp = 0.80`, `cfg = 0.50`
     - **Colère / Alerte / Indignation** : `exaggeration = 0.85`, `temp = 0.75`, `cfg = 0.65`
     - **Tristesse / Mélancolie** : `exaggeration = 0.55`, `temp = 0.62`, `cfg = 0.50`
     - **Peur / Inquiétude** : `exaggeration = 0.75`, `temp = 0.78`, `cfg = 0.55`
     - **Chuchotement** : `exaggeration = 0.45`, `temp = 0.65`, `cfg = 0.50`
     - **Narration de base** : `exaggeration = 0.55`, `temp = 0.75`, `cfg = 0.50`
     - **Surjeu sur les répliques / dialogues** : bonus systématique de `+0.15` d'`exaggeration` (jusqu'à `0.95`) et `temperature >= 0.78`.
  2. Mettre en cache GPU les conditionnements Chatterbox indexés par `(trimmed_path, exaggeration)` dans `self.chatterbox_cond_cache`.

---

## 2. Lecteur Audio & Volet de Notifications Android (`IntegratedAudioDeck.tsx` & `useRobustAudioPlayer.ts`)

### A. Synchronisation Totale avec le Volet de Notifications Android (Swipe Down)
- **Diagnostic** :
  Lorsqu'une histoire joue avec une musique d'ambiance, deux `HTMLAudioElement` coexistent (`globalStoryAudio` et `globalBgAudioElement` dans `useRobustAudioPlayer.ts`). Sur Android Chrome :
  1. Si l'utilisateur met en pause depuis le volet de notifications Android, l'OS déclenche soit `globalStoryAudio.onpause`, soit `globalBgAudioElement.onpause`, soit `navigator.mediaSession` `'pause'`.
  2. Si `audio.onpause` ne fait que `setIsPlaying(false)` ou si `mediaSession` appelle une closure React périmée de `stopAllPlayback`, la musique de fond ou le défilement automatique (`onPauseScroll`) ne s'arrêtent pas.
- **Implémentation obligatoire** :
  1. Maintenir `stopAllPlaybackRef.current = stopAllPlayback` à chaque rendu.
  2. Dans `globalStoryAudio.onpause`, appeler systématiquement `stopAllPlaybackRef.current()` dès que `!audio.ended`.
  3. Dans `useRobustAudioPlayer.ts`, exposer `pauseGlobalBackgroundAudio()` (appelé directement dans `stopAllPlayback()`) ainsi que `setOnExternalBgPause()`, afin qu'une pause déclenchée par l'OS Android sur la piste d'ambiance déclenche elle aussi `stopAllPlaybackRef.current()`.
