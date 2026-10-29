# Calmi TTS Private Architecture & Voice Cloning Roadmap

Ce document sert de mémoire persistante pour résumer l'intégration de la synthèse vocale privée (TTS) sur **Modal.com Serverless GPU (NVIDIA L4)**, le service **Hostinger VPS KVM2** et le routage des clones de voix utilisateur dans **Calmi**.

---

## 1. Vue d'Ensemble de l'Architecture Opérationnelle (2026)

```mermaid
flowchart TD
    A[Utilisateur clique sur 'Créer l'audio' dans Calmi] --> B[Edge Function Supabase : get-tts-config]
    B --> C{Type de Voix demandée ?}
    
    %% Branche Voix Familiale / Clone (Modal GPU)
    C -- Voix Familiale / Clone (Papa, Mamie Onix, etc.) --> D[Modal GPU Async Endpoint\nhttps://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run]
    D -->|Réponse HTTP 202 en < 1s| F[Frontend débloqué, statut: processing]
    D -.->|Si Erreur / Timeout Modal| G2[Fallback Instantané : generate-openai-tts\n~0.08 $ / histoire, prêt en 4s]
    D -->|Traitement GPU NVIDIA L4 en arrière-plan| G[CosyVoice 2 EU / Qwen3-TTS + Sleep Pacing]
    
    %% Branche Voix Standard (VPS Kokoro-82M)
    C -- Voix Standard / Conteuse --> E[VPS Hostinger Endpoint\n/synthesize-standard-async (Kokoro-82M)]
    E -->|Réponse HTTP 202 en < 1s| F
    E -.->|Si Erreur / VPS Indisponible| G2
    E -->|Inférence CPU ultra-rapide ~20s| G3[Kokoro-82M Inférence CPU + Sleep Pacing]

    %% Envoi des résultats
    G --> H[Upload direct vers Supabase Edge Function\nupload-audio-from-n8n]
    G2 --> H
    G3 --> H
    H --> I[Bucket Storage : audio-files]
    H --> J[Table audio_files : status = 'ready']
    J -->|Supabase Realtime WebSocket| K[Lecteur Audio Calmi : Prêt à écouter !]
```

---

## 2. Modal.com Serverless GPU : Modèle & Endpoints de Production

L'infrastructure principale de synthèse pour les clones vocaux familiaux s'exécute sur des **GPU NVIDIA L4** via Modal.com (`vps-tts-service/modal_app.py`).

### A. Modèle & Moteur
* **Moteur Principal** : **CosyVoice 2 (Hi! PARIS EU)** (`cosyvoice2-eu`) — spécialisé pour le français et les langues européennes, zéro-shot cloning haute fidélité avec RTF ~0.2.
* **Moteur de Secours** : `Qwen/Qwen3-TTS-12Hz-0.6B-Base` (activé automatiquement si CosyVoice 2 ne se charge pas).
* **Temps de génération** : **~2 à 3 minutes** pour une histoire de 10 min (divisé par 4 par rapport à Qwen3 seul).

### B. Endpoints Actifs & Règles Critiques d'Inférence CosyVoice 2
1. **Endpoint Fast-Gateway Asynchrone Principal (Production)** :
   - **URL** : `https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run`
   - **Méthode** : `POST`
   - **Comportement** : Conteneur CPU qui valide la requête, répond immédiatement avec `HTTP 202 Accepted` (< 500 ms) sans attendre le cold-start du GPU, et lance la tâche `CalmiTTSGPU().process_async_task.spawn(...)` sur GPU L4/A10G.
   - **Règle d'Attention (< 80 tokens / ≤ 200 chars par phrase)** : Chaque paragraphe est découpé en phrases courtes via `split_into_clean_sentences` et normalisé avec `frontend.text_normalize(sent, split=True, text_frontend=True)` afin d'éviter tout effondrement d'attention (« langue des Minions »).
   - **Cache d'Empreinte Vocale (`self.speaker_cache`)** : Les tenseurs Whisper + CampPlus + Mel de la voix de référence (plafonnée à 8 s max) sont extraits une seule fois par voix et conservés en mémoire GPU pour éliminer 100 % de l'overhead ONNX inter-phrases.
   - **Post-traitement** : Une fois l'histoire complète assemblée et masterisée (-16 LUFS), Modal l'envoie vers `https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n` (aucun upload partiel de chunk 0).
2. **Endpoint Synchrone (Aperçu Studio 5s & Tests Directs)** :
   - **URL** : `https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize.modal.run`
   - **Méthode** : `POST`
   - **Comportement** : Calcule et retourne directement le binaire `.wav` dans la réponse HTTP. Utilisé dans `VoiceStudio.tsx` pour l'aperçu vocal 5s de validation parentale (*« Bonne nuit mon petit trésor, fais de doux rêves dans les étoiles. »*).

### C. Contrainte Dépendances Critiques
* `cosyvoice2-eu 0.1.5` requiert strictement `transformers==4.40.1`.
* **Important :** Ne jamais installer `qwen-tts` dans le même conteneur (conflit de dépendances avec `transformers==4.57.3`).

### D. Spécification du Payload JSON
```json
{
  "text": "Texte complet de l'histoire...",
  "language": "fr",
  "voice_ref_url": "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/sign/voice-clones/.../sample.webm?token=...",
  "ref_text": "Transcription exacte de la phrase enregistrée par l'utilisateur",
  "instruct": "Warm, gentle bedtime story narrator for children, soft and peaceful pace",
  "sentence_pause_ms": 250,
  "paragraph_pause_ms": 1000,
  "chapter_pause_ms": 3000,
  "enable_sleep_pacing": true,
  "requestId": "uuid-request-id",
  "webhook_id": "uuid-request-id",
  "storyId": "uuid-story-id",
  "story_id": "uuid-story-id",
  "voiceId": "uuid-voice-id",
  "isCustomVoice": true
}
```

---

## 3. Hostinger VPS : Moteur Voix Standard Kokoro-82M (`vps-tts-service/kokoro_engine.py`)

* **Rôle** : Traiter 100 % des voix standards sans consommer de crédit GPU Modal.
* **Modèle** : `hexgrad/Kokoro-82M` (Licence Apache 2.0).
* **Vitesse** : Inférence en **~15-25 secondes sur CPU** pour 10 minutes d'histoire.
* **Coût** : **0,00 $** (forfait VPS Hostinger existant).

---

## 4. Déploiement et Commandes

### A. Re-déploiement Modal GPU (si modification de `modal_app.py`)
```bash
modal deploy vps-tts-service/modal_app.py
```

### B. Mise à jour VPS Hostinger (srv856374)
Le service tourne sous Docker dans `/root/calmi-tts` (conteneur `tts-service` sur port `8085:8000`) :
```bash
cd /root/calmi-tts
git pull
docker compose down
docker compose up -d --build
# Vérification santé :
curl http://localhost:8085/health
```

---

## 5. Table de Référence des Performances & Coûts

| Métrique | Modal GPU (CosyVoice 2 / L4) | VPS Hostinger (Kokoro-82M / CPU) | Fallback OpenAI TTS (API) |
| :--- | :--- | :--- | :--- |
| **Cas d'usage** | Clones vocaux familiaux (Papa, Maman...) | Voix standards (Conteuse, etc.) | Secours panne / timeout |
| **Temps de calcul (Histoire 10 min)** | **~2 à 3 minutes** | **~20 secondes** | **~4 secondes** |
| **Coût unitaire estimé** | **~0,05 $** (divisé par 4) | **0,00 $** (inclus VPS) | ~0,08 $ |
| **Licence** | Apache 2.0 | Apache 2.0 | Commerciale |

---

## 6. Fonctionnalités d'Immersion Audio & Sommeil (2026)

### A. Moteur de Bruitages Contextuels Doux (Sound FX ✨)
* **Emplacement :** `src/utils/soundEffectsEngine.ts`
* **Technologie :** Synthèse procédurale 100% Web Audio API native (0 Ko, 0 latence, 100% offline).
* **Acoustique :** Filtre passe-bas à 3 200 Hz, volume -12 dB (0.18 max), cooldown 6 secondes.
* **8 sonorités apaisantes :** `magic`, `stars`, `wind`, `stream`, `owl`, `fairy`, `bell` (528 Hz), `heartbeat`.
* **Sécurité TTS :** Les balises `[sfx:...]` sont systématiquement nettoyées par `stripStoryEmotionTags` avant synthèse vocale.

### B. Aperçu Vocal Studio IA 5s
* **Emplacement :** `src/pages/VoiceStudio.tsx`
* **Principe :** Test direct de la voix clonée en appelant le endpoint synchrone Modal GPU avec une phrase de coucher type. Permet aux parents de valider la voix avant de générer un conte complet.

### C. Prolongation Dodo (15 min)
* **Emplacement :** `src/components/story/reader/IntegratedAudioDeck.tsx`
* **Principe :** Maintient l'ambiance sonore/berceuse pendant 15 minutes à volume feutré (0.18) après la fin de la narration, avec fondu progressif de 60s vers le silence total.

### D. Téléchargement Prédictif PWA & Cache Routines
* **Emplacement :** `src/utils/audioCache.ts`, `src/hooks/useStoryRoutines.ts`
* **Principe :** Stockage local IndexedDB des histoires de coucher dès qu'elles sont prêtes ou planifiées dans une routine, pour une écoute immédiate sans connexion Wi-Fi.
