---
name: calmi-tts-audio
description: Architecture, règles d'inférence Chatterbox Multilingual & CosyVoice 2 sur Modal GPU, normalisation narrative française, gestion du cache audio IndexedDB et synchronisation mobile/notifications Android du lecteur IntegratedAudioDeck pour Calmi. ACTIVER ce skill pour toute modification ou tout diagnostic touchant à la synthèse vocale (TTS), au clonage de voix, au lecteur audio ou au cache hors-ligne.
---

# Skill : Architecture TTS (Chatterbox Multilingual & CosyVoice 2-EU) & Lecteur Audio Mobile (Calmi)

Ce skill regroupe les règles d'or et procédures opérationnelles pour maintenir une synthèse vocale française limpide, naturelle et sans défaut prosodique, ainsi qu'un lecteur mobile (`IntegratedAudioDeck.tsx`) parfaitement synchronisé avec l'OS (Android/iOS, volet de notifications inclus).

---

## 1. Moteur TTS Modal GPU (`vps-tts-service/modal_app.py`)

### A. Normalisation Narrative 100 % Française & Interdiction de `text_frontend=True`
- **Diagnostic critique** :
  1. Dans `cosyvoice`, `frontend.text_normalize(..., text_frontend=True)` exécute en réalité `en_tn_model` (le normaliseur de texte **anglais** de WeTextProcessing !) dès que le texte ne contient pas de caractères chinois. Activer `text_frontend=True` sur du français déforme les apostrophes (`l'`, `d'`, `s'`), les nombres et certains mots français.
  2. Les guillemets français (`«`, `»`), les tirets cadratins (`—`) et les points-virgules (`;`) perturbent les tokenizers BPE de Chatterbox et CosyVoice 2.
  3. Découper naïvement sur `(?<=[.!?…;])\s+` coupe **à l'intérieur** des répliques suivies d'une incise (ex: `« Je suis Cracrac ! » annonce-t-il`), laissant `» annonce-t-il` isolé en début de phrase suivante.
- **Implémentation obligatoire (`normalize_french_narrative_text` + `split_into_clean_sentences`)** :
  1. **Ne jamais utiliser `text_frontend=True`**. Toujours passer par `normalize_french_narrative_text(text)` qui :
     - fusionne les incises après guillemets (`[!?…]\s*»\s*,?\s*([a-zà-ÿ])` $\rightarrow$ `, \1`),
     - supprime les guillemets `«` et `»` ainsi que les tirets de début de réplique `—`,
     - convertit les `;` en `.` (devant majuscule) ou `,` (devant minuscule),
     - convertit les nombres (`0..9999`) en toutes lettres en **français** (`_int_to_french`),
     - supprime l'espace typographique français devant `, ! ? : .`.
  2. Dans `split_into_clean_sentences`, ne couper après `[.!?…]` **que si le caractère suivant est une majuscule** (`(?<=[.!?…])\s+(?=[A-ZÀ-Ÿ])`), afin de ne jamais séparer une citation de son verbe d'incise en minuscule (`annonce-t-il`, `murmure-t-il`, `répond Joseph`).
  3. Appliquer systématiquement un **fondu cosinus doux (`_apply_cosine_edges`, 12 ms fade-in / 18 ms fade-out)** sur chaque phrase synthétisée avant concaténation pour éliminer tout clic de phase aux transitions.

### B. Préservation du Timbre Vocal (« Papa ») & Double Moteur SOTA (Chatterbox Multilingual + CosyVoice 2-EU)
- **Diagnostic** :
  Le filtre FFmpeg `highpass=f=70,lowpass=f=12000,afftdn=nf=-25` rabotait les graves des voix masculines (`85–150 Hz`) et ajoutait un artefact métallique FFT sur l'empreinte vocale.
- **Implémentation obligatoire** :
  1. Dans `convert_to_wav`, utiliser uniquement `-af highpass=f=45 -ar 24000 -ac 1 -c:a pcm_s16le` (sans `afftdn` ni `lowpass=12000`), avec le préfixe de cache `voice_pure_v2_` et `volume.commit()`.
  2. Découper l'enregistrement de référence sur sa fenêtre optimale (`_get_trimmed_prompt_wav`, ex: `0.35s` à `7.60s` pour la voix `Papa`).
  3. Utiliser **Chatterbox Multilingual (`ResembleAI/chatterbox`, licence MIT commerciale)** en moteur principal (`language_id="fr"`, `exaggeration=0.35`, `cfg_weight=0.50`, `temperature=0.65`) avec mise en cache GPU des conditionnements (`self.chatterbox_cond_cache`), et conserver `CosyVoice2-0.5B-EU` corrigé (`frontend_zero_shot` sans `en_tn_model`) en second moteur / fallback immédiat.

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
