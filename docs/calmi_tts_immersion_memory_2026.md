# Mémoire Technique & Architecture : Immersion Audio Calmi (2026)

## 1. Contexte & Principes Cardinaux
- **Projet :** Calmi (PWA de contes personnalisés pour enfants).
- **Acoustique Sommeil :** Respect absolu de l'ambiance du coucher : aucune fréquence stridente (> 3200 Hz filtré), niveau feutré (-12 dB à -16 LUFS), fondus progressifs.
- **Règle Absolue :** **ElevenLabs est 100% banni** (coûts récurrents excessifs, dépendance externe). Remplacé par notre infrastructure privée hybride (Modal GPU + VPS Hostinger).

---

## 2. Infrastructure TTS Déployée & Opérationnelle

### A. Modal Serverless GPU (NVIDIA L4)
- **Application :** `calmi-tts-service` (définie dans `vps-tts-service/modal_app.py`).
- **Moteur Principal :** **CosyVoice 2 (Hi! PARIS EU)** (`cosyvoice2-eu`) — Clonage vocal zéro-shot haute fidélité pour le français et langues européennes.
- **Contrainte Dépendances :** `cosyvoice2-eu` impose strictement `transformers==4.40.1`. Ne jamais réintroduire de dépendances conflictuelles (comme `qwen-tts` qui requiert `transformers==4.57.3`).
- **Endpoints de Production :**
  - **Fast-Gateway Asynchrone (Production Unifiée) :**
    `https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run`
    - Conteneur CPU ultra-léger qui répond `HTTP 202` en < 500 ms sans bloquer sur le cold-start du GPU.
    - Délègue en arrière-plan via `.spawn()` à `CalmiTTSGPU.process_async_task`.
    - Téléverse uniquement l'histoire complète masterisée (-16 LUFS) via `upload-audio-from-n8n` (pas de téléversement partiel du chunk 0 afin d'éviter la mise en cache IndexedDB d'un fichier tronqué).
  - **Synchrone (Aperçu Studio 5s) :**
    `https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize.modal.run`
    - Reçoit `{ text, voice_ref_url, ref_text, instruct }` et retourne directement le binaire `audio/wav`.
- **Règles Critiques d'Inférence CosyVoice 2 (`modal_app.py`) :**
  1. **Découpage par phrase courte (≤ 200 chars) + `text_frontend=True`** : `CosyVoice2-0.5B-EU` a une fenêtre d'attention maximale de ~60–80 tokens par passe. Envoyer des blocs de 400–1100 caractères avec `text_frontend=False` provoque un effondrement d'attention (« langue des Minions » / syllabes inventées). Toujours utiliser `split_into_clean_sentences(..., max_sentence_chars=200)` + `frontend.text_normalize(sent, split=True, text_frontend=True)`.
  2. **Cache GPU de l'empreinte vocale (`self.speaker_cache`)** : Extraire les tenseurs `flow_prompt_speech_token`, `prompt_speech_feat`, `llm_embedding` et `flow_embedding` une seule fois par voix (audio de référence plafonné à 8 s max) via `_get_speaker_conditioning(prompt_path)`. Cela élimine les ~3,5 s d'overhead ONNX (Whisper + CampPlus) entre chaque phrase.
- **Commandes Déploiement :**
  Exécuter avec le CLI Modal :
  `modal deploy vps-tts-service/modal_app.py`

### B. Hostinger VPS (srv856374)
- **Rôle :** Synthèse gratuite des voix standards sans consommer de crédits GPU.
- **Moteur :** `Kokoro-82M` (inférence CPU ultra-rapide ~20s pour 10 min d'histoire).
- **Emplacement :** `/root/calmi-tts` avec sous-dossier `vps-tts-service`.
- **Conteneur Docker :** `tts-service` (mappé sur port `8085:8000`).
- **Vérification Santé :** `curl http://localhost:8085/health` -> `{"status":"healthy","device":"cpu","kokoro_available":true}`.

### C. Supabase Edge Functions Déployées
- `get-tts-config` (v106) : Fournit les URLs dynamiques Modal GPU et VPS Kokoro.
- `upload-audio-from-n8n` (v151) : Réceptionne les fichiers audio WAV masterisés sans référence ElevenLabs.
- `assemble-story-payload` (v24) : Injecte le catalogue de voix familiales `user_voices` et directives théâtrales multi-personnages dans le prompt LLM.

---

## 3. Les 4 Améliorations Majeures d'Immersion Audio

### 1. Bruitages Contextuels Doux (Sound FX ✨)
- **Fichier :** `src/utils/soundEffectsEngine.ts`
- **Technologie :** Synthèse procédurale 100% Web Audio API native (0 Ko de téléchargement réseau, 0ms latence, 100% hors-ligne).
- **Profil Acoustique :** Filtre passe-bas à 3200 Hz, volume atténué à 0.18 (-12 dB), cooldown de 6 secondes anti-surcharge.
- **8 Effets Modélisés :** `magic`, `stars`, `wind`, `stream`, `owl`, `fairy`, `bell` (528 Hz), `heartbeat`.
- **Détection & Nettoyage :** Détecte les balises `[sfx:...]` et tournures sémantiques. `stripStoryEmotionTags` garantit que ces balises ne sont jamais lues par le TTS.
- **Contrôle :** Interrupteur dans le popover d'ambiance du deck (`IntegratedAudioDeck.tsx`).

### 2. Aperçu Vocal IA 5s dans le Studio
- **Fichier :** `src/pages/VoiceStudio.tsx`
- **Usage :** Bouton « Aperçu IA » sur chaque carte de voix clonée.
- **Fonctionnement :** Appelle l'endpoint synchrone Modal GPU avec la phrase :
  *« Bonne nuit mon petit trésor, fais de doux rêves dans les étoiles. »*
  Permet d'entendre le timbre CosyVoice 2 avant toute génération de conte.

### 3. Prolongation Dodo (15 min)
- **Fichier :** `src/components/story/reader/IntegratedAudioDeck.tsx`
- **Principe :** À la fin de l'histoire, maintient l'ambiance sonore/berceuse pendant 15 minutes à volume feutré (0.18) pour bercer l'enfant jusqu'au sommeil profond.
- **Fondu :** Décroissance imperceptible sur les 60 dernières secondes jusqu'à extinction.
- **Interface :** Bannière discrète `🌙 Prolongation dodo active (MM:SS)` avec bouton d'arrêt.

### 4. Téléchargement Prédictif PWA & Cache Routines
- **Fichiers :** `src/utils/audioCache.ts`, `src/hooks/useStoryRoutines.ts`
- **Mécanisme :** Dès qu'un fichier audio est prêt ou programmé dans une routine du soir active, il est pré-téléchargé et stocké en Blob dans IndexedDB (`CalmiAudioCache`).
- **Sécurité & Versionnement du Cache :**
  - Clé de cache versionnée par le nom du fichier généré (`getAudioCacheKey(storyId, audioUrl)`).
  - Vérification stricte de l'intégrité (`blob.size >= expectedSize * 0.9`) pour auto-purger tout fragment incomplet.
- **Bénéfice :** Démarrage instantané 0 seconde au lit, sans coupure et sans dépendance au réseau Wi-Fi.

### 5. Synchronisation Mobile & Responsive de la Capsule Audio (`IntegratedAudioDeck.tsx`)
- **Synchronisation Native / OS (MediaSession Android & iOS) :**
  - Vérification prioritaire de l'état réel du DOM (`!audioRef.current.paused`) dans `handlePlayPause` pour garantir que le bouton met toujours en pause un audio actif même en cas de désynchronisation d'état React.
  - Écouteurs bidirectionnels `audio.onplay` / `audio.onpause` et verrou anti-concurrence `isStartingPlaybackRef`.
- **Responsive Mobile (320px–430px) :**
  - Utilisation exclusive de classes Tailwind standards (`h-[52px]`, `h-8 w-8 sm:h-9 sm:w-9`) avec `min-w-0 flex-shrink` sur le sélecteur de voix et `shrink-0` sur les boutons d'action et d'ambiance (`✓` et `🌙`).
