---
name: calmi-tts-audio
description: Architecture, règles d'inférence CosyVoice 2 EU & Chatterbox Multilingual sur Modal GPU, élimination des bruits parasites (sans noise-gate agate, silence feutré anti-clics), calibrage strict des durées de conte, cohérence des voix théâtrales par genre, normalisation narrative française, gestion du cache audio IndexedDB et synchronisation mobile/notifications Android du lecteur IntegratedAudioDeck pour Calmi. ACTIVER ce skill pour toute modification ou tout diagnostic touchant à la synthèse vocale (TTS), au clonage de voix, au lecteur audio ou au cache hors-ligne.
---

# Skill : Architecture TTS (CosyVoice 2-EU & Chatterbox), Lecteur Audio Mobile & Continuité Narrative (Calmi)

Ce skill regroupe l'ensemble des règles d'or, garde-fous acoustiques et procédures opérationnelles pour garantir une synthèse vocale française limpide, vivante, continue (« Lecture Vivante Unifiée »), adaptée aux objectifs de chaque histoire (coucher vs journée), avec un coût GPU rigoureusement inférieur à 10 centimes par histoire.

---

## 1. Moteur TTS Modal GPU (`vps-tts-service/modal_app.py`)

### A. Élimination Totale des Bruits Parasites & Silences Numériques Purs
- **Diagnostic critique** :
  1. Le filtre FFmpeg `agate` (noise-gate dynamique) hachait la voix et produisait des artéfacts de pompage.
  2. L'injection de bruit blanc aléatoire (`np.random.normal`) dans les pauses générait un souffle audible qui s'allumait et s'éteignait brusquement entre chaque phrase (effet « micro qui coupe et se rallume »).
  3. Des boosts agressifs d'égalisation (+2.5 dB à 3.8 kHz et +1.5 dB à 9.5 kHz) amplifiaient les bruits de salive, la sibilance et le souffle de micro.
- **Règles d'or & Implémentation obligatoire** :
  1. **Interdiction formelle du bruit blanc aléatoire** : Les pauses (`_create_natural_pause`) utilisent un vrai silence numérique à zéro absolu (`np.zeros(..., dtype=np.float32)`).
  2. **Micro-fondus d'attaque ultra-courts (2.5 ms / 3.5 ms)** : `_apply_cosine_edges` applique un micro-lissage cosinus de 2.5 ms en entrée et 3.5 ms en sortie. Cela élimine 100 % des clics DC de conversion DAC sans jamais rogner les consonnes d'attaque.
  3. **Mastering broadcast EBU R128 (-16 LUFS) feutré** :
     - Coupe-bas 60 Hz (`highpass=f=60`)
     - Dé-boxage chirurgical à 450 Hz (`equalizer=f=450:width_type=q:w=1.2:g=-3.0`)
     - Présence vocale douce à 3.2 kHz (`equalizer=f=3200:width_type=q:w=1.0:g=+0.8`) — pas de boost aigu artificiel à 9.5 kHz.
     - Normalisation loudness douce (`loudnorm=I=-16:TP=-1.5:LRA=8:dual_mono=true`).

### B. Moteur Vocal Français Natif (CosyVoice 2 EU) & API Officielle Native
- **Diagnostic critique** :
  - `cosy.tts()` appelle en interne `inference_cross_lingual(text, prompt_16k)`.
  - Dans ce mode, `text` est tokenisé directement comme le flux de parole à synthétiser.
  - L'injection d'instructions en anglais suivies de `<|endofprompt|>` dans `text` corrompait la séquence BPE, provoquant des sauts de phase, des clics et des bruits de bouche au début de chaque phrase.
- **Règle d'or** :
  - **Fournir du texte narratif français pur** à `self.cosy_model.tts(text=clean_input, prompt=prompt_wav_to_use)`.
  - Zéro injection de prompt de style anglais ou de tokens spéciaux dans `text`.
  - L'empreinte vocale est transmise fidèlement via le fichier WAV de référence du locuteur (`prompt`).

### C. Normalisation Narrative 100 % Française & Ponctuation Propre
- **Règles syntaxiques absolues (`normalize_french_narrative_text`)** :
  1. **Ne JAMAIS utiliser `text_frontend=True`** dans CosyVoice (il déclenche le normaliseur anglais `en_tn_model`).
  2. **Élimination de toute ponctuation initiale** : `s = re.sub(r'^[,\s:;–—.-]+', '', s)` pour qu'aucun segment ne commence par une virgule (ex: `, avertit Madame Sable` -> `Avertit Madame Sable`).
  3. **Suppression des doubles ponctuations** : Éviter les artefacts syntaxiques comme `,.` ou `:.` en purgeant les virgules en fin de clause (`rstrip(",:; ")`) avant d'ajouter un point.
  4. **Normalisation des deux-points (`:`) et points de suspension (`...`)** :
     - Les deux-points dans le récit (`Clic : il s'encastre`) sont convertis en virgule fluide (`,`) ou point final (`.`).
     - Les points de suspension sont convertis en virgule douce ou point contextuel, évitant les hésitations anormales du modèle.
  5. **Conversion des nombres en toutes lettres** en français (`_int_to_french`).
  6. **Majuscule initiale systématique** sur le premier caractère alphabétique.

### D. Synthèse par Blocs Paragraphes Continus (Fin du saucissonnage)
- **Principe** :
  - Porter le seuil de découpage à **380 caractères** (`split_into_clean_sentences(text, max_sentence_chars=380)`).
  - CosyVoice 2 EU synthétise un paragraphe complet d'un seul tenant : le modèle neural gère lui-même les respirations, les baisses de ton aux points et les liaisons aux virgules.
  - Fin des coupures numériques de 200 ms et des micro-fondus hachés entre chaque phrase de 10 mots.

---

## 2. Lecture Vivante Unifiée vs Théâtre Multi-Voix (`useN8nAudioGeneration.ts`)

- **Règle d'or : Priorité à la « Lecture Vivante Unifiée » (Continuous Storytelling)** :
  - Quand l'utilisateur sélectionne sa voix clonée (ou la voix du narrateur), **l'histoire n'est plus découpée en répliques isolées**.
  - La voix choisie porte l'intégralité du texte (récit et dialogues) dans un flux continu, fluide et expressif, exactement comme un parent lisant un livre.
  - Cela évite le remplacement absurde de personnages par des voix secondaires inadéquates (ex: Mamie Onix pour Madame Sable) et élimine les silences de 450 ms entre dialogues et incises.
  - **Économie financière majeure** : Réduction de 35 à 40 % du temps d'inférence GPU, garantissant un coût largement inférieur à 10 centimes par histoire.
- **Théâtre Multi-Voix** :
  - Activé **uniquement** si explicitement demandé par l'utilisateur (`dynamicVoiceId === 'theatre_multivoice'`).

---

## 3. Expérience Lecteur (`IntegratedAudioDeck.tsx`) & Adaptation aux Objectifs

### A. Volume Constant jusqu'à la Fin (Interdiction du Fade-out 30s)
- **Règle absolue** : **Ne JAMAIS baisser le volume de la voix sur les 30 dernières secondes**.
- `audio.volume` reste rigoureusement à `1.0` (100 %) jusqu'à la dernière syllabe pour que la morale et la chute de l'histoire soient parfaitement audibles et comprises.

### B. Adaptation Stricte à l'Objectif de l'Histoire
- **Prolongation Dodo (15 min)** :
  - Activée **uniquement** si l'objectif de l'histoire est explicitement lié au sommeil (`sleep`, `sommeil`, `coucher`, `dodo`) ou si l'utilisateur a manuellement sélectionné une musique d'ambiance.
  - Pour les histoires de jour (**autonomie, courage, curiosité, aventure, émotions**), l'audio s'arrête nettement et proprement à la fin, sans prolonger de berceuse en pleine journée.
- **Pacing Sommeil (Sleep Pacing)** :
  - Le ralentissement progressif du rythme vocal ne s'applique qu'aux histoires dont l'objectif est le sommeil (`enable_sleep_pacing = true`). Les histoires d'action et d'aventure conservent leur énergie et leur dynamisme.

### C. Bruitages Procéduraux Web Audio Désactivés par Défaut
- Dans `IntegratedAudioDeck.tsx` et `soundEffectsEngine.ts`, `isSfxEnabled` et le moteur Web Audio sont **`false` par défaut**.
- Aucun bip, sweep ou pulsation ne se déclenche inopinément sur les mots-clés du texte (« étoile », « ruisseau », « chouette ») pendant la narration.
- L'utilisateur peut l'activer volontairement dans les réglages s'il le souhaite.

### D. Synchronisation MediaSession & Notifications Android
- Synchroniser bidirectionnellement `audio.onplay` et `audio.onpause` avec `navigator.mediaSession`.
- Lors d'une pause externe (casque Bluetooth, écran verrouillé, volet Android), appeler immédiatement `stopAllPlaybackRef.current()` pour couper simultanément la voix, l'ambiance sonore et l'auto-scroll.

---

## 4. Calibrage Strict des Durées de Lecture & Plafonds de Mots (`story.ts` & `readingTime.ts`)

- **3 minutes (Express)** : Cible = ~290–310 mots, Min = 260 mots, **Plafond strict Max = 340 mots**.
- **5 minutes (Courte)** : Cible = ~500–530 mots, Min = 470 mots, **Plafond strict Max = 575 mots**.
- **10 minutes (Moyenne)** : Cible = ~1050 mots, Min = 950 mots, **Plafond strict Max = 1140 mots**.
- **15 minutes (Longue)** : Cible = ~1550 mots, Min = 1450 mots, **Plafond strict Max = 1750 mots**.
- Sécurité d'affichage (`calculateReadingTime`) : si un texte fait $\le 360$ mots, son affichage est rigoureusement capé à `~3 min de lecture`.
