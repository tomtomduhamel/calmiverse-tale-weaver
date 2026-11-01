---
name: calmi-tts-audio
description: Architecture, règles d'inférence CosyVoice 2 EU & Chatterbox Multilingual sur Modal GPU, élimination des bruits parasites (sans noise-gate agate, silence feutré anti-clics), calibrage strict des durées de conte, cohérence des voix théâtrales par genre, normalisation narrative française, gestion du cache audio IndexedDB et synchronisation mobile/notifications Android du lecteur IntegratedAudioDeck pour Calmi. ACTIVER ce skill pour toute modification ou tout diagnostic touchant à la synthèse vocale (TTS), au clonage de voix, au lecteur audio ou au cache hors-ligne.
---

# Skill : Architecture TTS (CosyVoice 2-EU & Chatterbox) & Lecteur Audio Mobile (Calmi)

Ce skill regroupe les règles d'or et procédures opérationnelles pour maintenir une synthèse vocale française limpide, vivante, naturelle (style podcast animé/NotebookLM) et sans défaut prosodique, ainsi qu'un calibrage rigoureux des durées de lecture et un lecteur mobile (`IntegratedAudioDeck.tsx`) parfaitement synchronisé avec l'OS (Android/iOS, volet de notifications inclus).

---

## 1. Moteur TTS Modal GPU (`vps-tts-service/modal_app.py`)

### A. Élimination Totale des Bruits Parasites & Clacs Numériques (Zéro Agate / Silence Feutré)
- **Diagnostic critique** :
  1. Le filtre FFmpeg `agate` (noise-gate dynamique) s'ouvrait en 15 ms et se refermait brutalement sur chaque fin de mot, souffle ou voyelle douce, produisant des claquements, bruits parasites et artéfacts de pompage perçus comme des bogues par l'utilisateur.
  2. L'insertion de silences numériques purs (`np.zeros`, $-\infty\text{ dB}$) entre les phrases ou segments provoquait des sauts de phase et des coupures sèches lors du décodage DAC.
- **Règles d'or & Implémentation obligatoire** :
  1. **Interdiction formelle du filtre `agate`** dans `master_audio_bytes` et `convert_to_wav`.
  2. **Silences naturels feutrés (`_create_natural_pause`)** : générer un micro-bruit feutré studio inaudible (à $-75\text{ dB}$) avec fondu cosinus doux (8 ms) en entrée/sortie pour maintenir la continuité acoustique entre chaque phrase et chaque réplique sans le moindre clac.
  3. Chaîne de mastering broadcast EBU R128 (-16 LUFS) :
     - Coupe-bas 60 Hz (`highpass=f=60`)
     - Dé-boxage chirurgical à 450 Hz (`equalizer=f=450:width_type=q:w=1.2:g=-3.0`)
     - Rehausse de clarté studio à 3.8 kHz (`equalizer=f=3800:width_type=q:w=1.0:g=+2.5`)
     - Air soyeux à 9.5 kHz (`treble=g=+1.5:f=9500`)
     - Normalisation loudness EBU R128 (`loudnorm=I=-16:TP=-1.5:LRA=8:dual_mono=true`).

### B. Moteur Vocal Français Natif (CosyVoice 2 EU) & Élimination de l'Accent Anglophone
- **Diagnostic critique** :
  Chatterbox Multilingual est initialisé sur des priors anglophones. Même avec `cfg_weight = 0.0`, la prosodie française peut rester atone ou trahir un léger accent anglo-saxon.
- **Solution & Routage obligatoire (`_synthesize_block_auto`)** :
  1. Pour tout texte français (`language == 'fr'`), le moteur **CosyVoice 2 EU** (conçu par le laboratoire français Hi! PARIS) est prioritaire à 100 %.
  2. CosyVoice 2 EU offre un accent français irréprochable, une prosodie chantante naturelle et un clonage zero-shot fidèle.
  3. Chatterbox Multilingual est conservé en solution de repli (fallback automatique) ou si explicitement requis (`prefer_engine='chatterbox'`).
  4. Modulation dynamique de vitesse (`speed`) dans CosyVoice 2 :
     - `1.04` pour les moments de joie/rire/action vive (`excited`, `fun`),
     - `0.93` pour l'accompagnement du coucher (`sleepy`),
     - `0.97` pour la relaxation (`calm`).

### C. Normalisation Narrative 100 % Française & Découpage Prudent
- **Normalisation (`normalize_french_narrative_text`)** :
  - **Ne JAMAIS utiliser `text_frontend=True`** dans CosyVoice car il exécute `en_tn_model` (normaliseur anglais).
  - Préserver impérativement la ponctuation expressive (`!`, `?`, `…`) devant les incises.
  - Convertir les nombres en toutes lettres en français (`_int_to_french`).
  - Découper dans `split_into_clean_sentences` uniquement quand la ponctuation forte est suivie d'une majuscule (`(?<=[.!?…])\s+(?=[A-ZÀ-Ÿ])`), pour ne jamais séparer un dialogue de son verbe d'incise (`annonce-t-elle`).
  - Appliquer un fondu cosinus doux (`_apply_cosine_edges`, 12 ms fade-in / 18 ms fade-out) sur chaque phrase.

---

## 2. Cohérence des Voix Théâtrales & Attribution Multi-Voix (`storyAudioParser.ts`)

- **Diagnostic** :
  L'attribution automatique par défaut envoyait tous les personnages inconnus dans `category: 'children'`, ce qui donnait à des figures masculines adultes (ex: Papa, Monsieur Tuba, le chef de fanfare) la voix d'un petit garçon ou de Mamie.
- **Règles d'attribution stricte (`resolveSmartVoice` & `detectCharacterCategoryAndName`)** :
  1. **Détection des figures adultes** : Les termes `monsieur, chef, docteur, capitaine, maître, voisin, roi, fermier, boulanger` sont classés en adultes (`narrator_family`).
  2. **Filtrage strict de cohérence de genre** :
     - Pour un personnage féminin (Mamie, Maman, Madame, Reine), il est formellement interdit d'attribuer une voix d'homme (Papa, Papi).
     - Pour un personnage masculin (Papa, Papi, Monsieur), il est formellement interdit d'attribuer une voix de femme (Mamie, Maman).
     - Pour une petite fille, il est formellement interdit d'attribuer la voix d'un jeune garçon.
  3. En cas d'absence de clone vocal du genre correspondant dans le catalogue de l'utilisateur, basculer sur la voix du narrateur principal plutôt que de dénaturer le personnage.

---

## 3. Calibrage Strict des Durées de Lecture & Plafonds de Mots (`story.ts` & `readingTime.ts`)

- **Diagnostic** :
  Demander une histoire de 3 minutes produisait des textes de plus de 450 mots qui s'affichaient ensuite à « ~5 min de lecture » sur la carte de lecture.
- **Formule unifiée & Plafonds stricts (`getDurationWordBounds`)** :
  - **3 minutes (Express)** : Cible = ~290–310 mots, Min = 260 mots, **Plafond strict Max = 340 mots**.
  - **5 minutes (Courte)** : Cible = ~500–530 mots, Min = 470 mots, **Plafond strict Max = 575 mots**.
  - **10 minutes (Moyenne)** : Cible = ~1050 mots, Min = 950 mots, **Plafond strict Max = 1140 mots**.
  - **15 minutes (Longue)** : Cible = ~1550 mots, Min = 1450 mots, **Plafond strict Max = 1750 mots**.
- **Sécurité d'affichage (`calculateReadingTime`)** :
  Si un texte fait $\le 360$ mots, son affichage est rigoureusement capé à `~3 min de lecture` pour éviter les sauts d'arrondi à 4 ou 5 min.

---

## 4. Lecteur Audio & Volet de Notifications Android (`IntegratedAudioDeck.tsx`)

- Maintenir `stopAllPlaybackRef.current = stopAllPlayback` à chaque rendu.
- Dans `globalStoryAudio.onpause`, appeler systématiquement `stopAllPlaybackRef.current()` dès que `!audio.ended`.
- Dans `useRobustAudioPlayer.ts`, exposer `pauseGlobalBackgroundAudio()` et `setOnExternalBgPause()` pour répercuter instantanément la mise en pause depuis les écouteurs Bluetooth ou le volet de notification Android sur l'ensemble de l'expérience sonore et le défilement du texte.
