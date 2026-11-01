# Standards TTS CosyVoice 2 EU, Chatterbox, Cache Audio & Lecteur Mobile - Calmiverse (v4.0)

Ce document consigne les règles critiques d'ingénierie apprises lors de la résolution des problèmes de synthèse vocale (« langue des Minions » / effondrement d'attention, élimination des bruits parasites/clics de noise-gate, accent anglophone résiduel, neutralité émotionnelle), de timeouts HTTP, de calibrage strict des durées, de cohérence des voix théâtrales par genre, de synchronisation MediaSession Android et de responsive mobile sur le lecteur `IntegratedAudioDeck`.

---

## 1. Moteur TTS CosyVoice 2 EU & Chatterbox Multilingual (`vps-tts-service/modal_app.py`)

### Règle n°1 : Priorité Absolue à CosyVoice 2 EU pour le Français (Zéro Accent Anglophone)
- **Problème identifié (Accent anglophone & monotonie de Chatterbox)** :
  Chatterbox Multilingual est basé sur des données pré-entraînées majoritairement anglophones (LibriSpeech/VCTK). Même avec `cfg_weight = 0.0`, il conserve une prosodie plate et une coloration phonétique anglaise sur le français.
- **Règle absolue** :
  1. Pour tout texte en langue française (`language == 'fr'`), le moteur **CosyVoice 2 EU** (développé par l'institut de recherche français Hi! PARIS) est prioritaire à 100 %.
  2. Il offre une phonétique française native, des courbes mélodiques chantantes pour enfants et un clonage zero-shot fidèle.
  3. Chatterbox Multilingual est conservé en fallback automatique ou si explicitement requis (`prefer_engine='chatterbox'`).
  4. Modulation dynamique de vitesse (`speed`) dans CosyVoice 2 selon l'émotion :
     - `1.04` pour l'action vive, le rire et la joie (`excited`, `fun`),
     - `0.93` pour l'apaisement du coucher (`sleepy`),
     - `0.97` pour la détente (`calm`),
     - `1.0` par défaut.

### Règle n°2 : Élimination des Bruits Parasites & Clacs Numériques (Zéro Agate / Silence Feutré Studio)
- **Problème identifié (Claquements de noise-gate et clics de coupure numérique)** :
  1. L'application du filtre FFmpeg `agate` (noise-gate dynamique) refermait brutalement le signal sur les fins de mots et s'ouvrait en 15 ms, créant des bruits parasites (« clics » ou « pops » de coupure) perçus comme des bugs.
  2. L'insertion de silences numériques purs (`np.zeros`, $-\infty\text{ dB}$) entre les phrases produisait des micro-sauts de phase lors du décodage DAC.
- **Règles absolues** :
  1. **Interdiction formelle du filtre `agate`** dans `master_audio_bytes` et `convert_to_wav`.
  2. **Silences naturels feutrés (`_create_natural_pause`)** : générer un micro-bruit feutré studio inaudible (à $-75\text{ dB}$) avec fondu cosinus doux (8 ms) en entrée/sortie pour maintenir la continuité acoustique entre chaque phrase et chaque réplique sans le moindre clac.
  3. Chaîne de mastering broadcast EBU R128 (-16 LUFS) :
     - Coupe-bas 60 Hz (`highpass=f=60`)
     - Dé-boxage chirurgical à 450 Hz (`equalizer=f=450:width_type=q:w=1.2:g=-3.0`)
     - Rehausse de clarté studio à 3.8 kHz (`equalizer=f=3800:width_type=q:w=1.0:g=+2.5`)
     - Air soyeux à 9.5 kHz (`treble=g=+1.5:f=9500`)
     - Normalisation loudness EBU R128 (`loudnorm=I=-16:TP=-1.5:LRA=8:dual_mono=true`).

### Règle n°3 : Normalisation Narrative 100 % Française & Découpage Prudent
- **Normalisation (`normalize_french_narrative_text`)** :
  - **Ne JAMAIS utiliser `text_frontend=True`** dans CosyVoice car il exécute `en_tn_model` (normaliseur anglais).
  - Préserver impérativement la ponctuation expressive (`!`, `?`, `…`) devant les incises.
  - Convertir les nombres en toutes lettres en français (`_int_to_french`).
  - Découper dans `split_into_clean_sentences` uniquement quand la ponctuation forte est suivie d'une majuscule (`(?<=[.!?…])\s+(?=[A-ZÀ-Ÿ])`), pour ne jamais séparer un dialogue de son verbe d'incise (`annonce-t-elle`).
  - Appliquer un fondu cosinus doux (`_apply_cosine_edges`, 12 ms fade-in / 18 ms fade-out) sur chaque phrase.

### Règle n°4 : Architecture Fast-Gateway Asynchrone (< 500 ms)
- Toutes les requêtes TTS (`get-tts-config`) doivent cibler le **CPU Fast-Gateway** (`synthesize_async_fast`), qui répond `HTTP 202 Accepted` en `< 500 ms` et délègue par `.spawn()` au worker GPU `CalmiTTSGPU.process_async_task`, éliminant définitivement les timeouts de cold-start GPU et de passerelle n8n/Supabase.

---

## 2. Attribution des Voix Théâtrales & Cohérence par Genre (`storyAudioParser.ts`)

- **Problème identifié** :
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

- **Problème identifié** :
  Demander une histoire de 3 minutes produisait des textes de plus de 450 mots qui s'affichaient ensuite à « ~5 min de lecture » sur la carte de lecture.
- **Formule unifiée & Plafonds stricts (`getDurationWordBounds`)** :
  - **3 minutes (Express)** : Cible = ~290–310 mots, Min = 260 mots, **Plafond strict Max = 340 mots**.
  - **5 minutes (Courte)** : Cible = ~500–530 mots, Min = 470 mots, **Plafond strict Max = 575 mots**.
  - **10 minutes (Moyenne)** : Cible = ~1050 mots, Min = 950 mots, **Plafond strict Max = 1140 mots**.
  - **15 minutes (Longue)** : Cible = ~1550 mots, Min = 1450 mots, **Plafond strict Max = 1750 mots**.
- **Sécurité d'affichage (`calculateReadingTime`)** :
  Si un texte fait $\le 360$ mots, son affichage est rigoureusement capé à `~3 min de lecture` pour éviter les sauts d'arrondi à 4 ou 5 min.

---

## 4. Lecteur Audio (`IntegratedAudioDeck.tsx`) & Synchronisation Mobile

### Règle n°5 : Singleton `globalStoryAudio`, Coupe-Circuit Total (`stopAllPlayback`) & Neutralisation de `utterance.onend` sur Android
- Maintenir `stopAllPlaybackRef.current = stopAllPlayback` à chaque rendu.
- Dans `globalStoryAudio.onpause`, appeler systématiquement `stopAllPlaybackRef.current()` dès que `!audio.ended`.
- Dans `useRobustAudioPlayer.ts`, exposer `pauseGlobalBackgroundAudio()` et `setOnExternalBgPause()` pour répercuter instantanément la mise en pause depuis les écouteurs Bluetooth ou le volet de notification Android sur l'ensemble de l'expérience sonore et le défilement du texte.
