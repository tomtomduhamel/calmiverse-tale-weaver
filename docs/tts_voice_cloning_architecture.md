# Calmi TTS Private Architecture & Voice Cloning Roadmap

Ce document sert de mémoire persistante pour résumer l'intégration de la synthèse vocale privée (TTS) sur votre **Hostinger VPS KVM2** et définit les fondations pour le futur développement de l'interface de clonage de voix utilisateur dans **Calmi**.

---

## 1. État Actuel de l'Architecture Deployed (Mai 2026)

L'architecture actuelle contourne l'utilisation d'API cloud commerciales (ElevenLabs/Speechify) en déportant l'inférence lourde sur votre propre serveur privé.

### A. Le Serveur d'Inférence IA (VPS Hostinger)
*   **IP & Port :** `http://31.97.40.49:8085` (ou sous-domaine avec SSL Nginx Certbot).
*   **Technologie :** Conteneur Docker isolé faisant tourner une application FastAPI en Python 3.10.
*   **Modèle d'IA :** **Qwen3-TTS-12Hz-0.6B-Base** d'Alibaba, optimisé pour CPU (PyTorch CPU). Le modèle est chargé via la bibliothèque officielle **`qwen-tts`** et sa classe **`Qwen3TTSModel`** en autorisant le code distant (`trust_remote_code=True`).
*   **Sécurité :** Authentification obligatoire via le header `X-API-Key` contenant le jeton défini dans la variable d'environnement `TTS_API_KEY` lors du lancement du conteneur.
*   **Endpoints principaux :**
    - `GET /health` : Test de santé public.
    - `POST /synthesize` : Effectue le clonage *zero-shot* et génère l'audio. Reçoit le texte, la langue mapped (ex: `"French"`) et l'URL publique de référence de la voix (ex: `thomasduhamel.wav`). Renvoie un fichier binaire de sortie `.wav`.

### B. Le Cache Persistant Offline (PWA Calmi)
*   **Technologie :** Module d'écriture/lecture local **[audioCache.ts](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/src/utils/audioCache.ts)** s'appuyant sur **IndexedDB** pour stocker les fichiers audio des histoires sous forme de Blobs.
*   **Intégration Composant :** Le lecteur **[N8nAudioPlayer.tsx](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/src/components/story/reader/N8nAudioPlayer.tsx)** pré-charge l'audio généré par le VPS dans l'IndexedDB dès qu'il est prêt. En mode déconnecté (offline), il joue l'audio directement depuis IndexedDB à la milliseconde sans aucune charge CPU ou appel réseau, affichant le badge : `Disponible hors-ligne (Prête pour le lit 🛌)`.
*   **Administration :** Le composant **[TtsConfigPanel.tsx](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/src/components/admin/TtsConfigPanel.tsx)** a été mis à jour pour prendre en charge et afficher visuellement le provider `vps-hostinger` (Hostinger VPS Privé).

---

## 2. Feuille de Route : Interface de Création d'un Clone Vocal Utilisateur

Cette section sert de base de départ pour la prochaine conversation concernant le paramétrage de l'interface utilisateur permettant à un parent ou enfant d'enregistrer et cloner sa propre voix :

### Étape A : L'interface d'Enregistrement Vocale (Frontend Calmi)
1.  **Créer un bouton "Enregistrer ma voix"** dans les paramètres de profil de Calmi.
2.  Utiliser l'**API MediaRecorder** du navigateur (HTML5) pour capturer l'audio du microphone en direct.
3.  Afficher une phrase guide d'environ 10-15 secondes que l'utilisateur doit lire à haute voix avec un ton chaleureux (ex: *"Bienvenue dans Calmi, je m'apprête à te raconter une histoire merveilleuse pour t'endormir paisiblement..."*).
4.  Générer un fichier `.wav` propre (16kHz ou 24kHz mono) et l'envoyer dans le bucket Supabase `voice-clones` sous le nom `user_ref_[userId].wav`.

### Étape B : Base de Données (Supabase)
1.  Créer une table `user_voices` pour mapper les voix créées :
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `name` (text, ex: "Maman", "Papa")
    - `voice_ref_path` (text, chemin du fichier .wav dans le bucket Storage)
    - `transcript` (text, la phrase exacte lue par l'utilisateur pour aider le modèle zero-shot)
    - `created_at` (timestamp)

### Étape C : Intégration dans le Pipeline de Synthèse
1.  Lors de la génération d'une nouvelle histoire via n8n, récupérer l'URL signée du fichier `user_ref_[userId].wav` de l'utilisateur et son `transcript` associé.
2.  Appeler l'API de votre VPS Hostinger KVM2 sur `/synthesize` :
    ```json
    {
      "text": "Le texte de l'histoire...",
      "voice_ref_url": "https://[supabase]/storage/v1/object/public/voice-clones/user_ref_[userId].wav",
      "ref_text": "Le texte exact qui a été lu pendant l'enregistrement",
      "language": "French"
    }
    ```
3.  Le VPS génère instantanément la voix clonée de l'utilisateur sans aucun réentraînement lourd et stocke le `.mp3` dans Supabase Storage, prêt à être synchronisé dans l'IndexedDB de l'appareil.

---

## 3. Architecture Opérationnelle n8n & VPS Hostinger (Mise à jour Juillet 2026)

### A. Serveur d'Inférence IA VPS Hostinger (31.97.40.49:8085)
- **Mapping de Port Docker** : `docker run -d --name tts-service -p 8085:8000 -e TTS_API_KEY="..." --restart unless-stopped calmi-tts-service`
  - Port de l'hôte : `8085` (ouvert et accessible à n8n).
  - Port du conteneur : `8000` (FastAPI Uvicorn interne).
- **Authentification par Clé d'API** : Exige le header HTTP `X-API-Key` défini dans la variable d'environnement `TTS_API_KEY` lors du lancement du conteneur Docker.
- **Support des Voix Standards / Stock** : Dans [`vps-tts-service/main.py`](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/vps-tts-service/main.py#L70), `voice_ref_url` est désormais optionnel (`Optional[str] = None`). Si aucune voix personnalisée n'est transmise (voix stock ou local), le serveur bascule automatiquement sur l'audio de référence français par défaut `DEFAULT_REF_URL` pour éliminer tout risque d'erreur 422 Unprocessable Entity.
- **Synthèse Vocale Intégrale par Chunking & Concaténation (v1.4.0)** :
  - **Fonction `chunk_text(text, max_chars=250)`** : Fragmente dynamiquement le texte complet de l'histoire (750 à 2500 mots) en phrases naturelles tout en respectant la ponctuation (`. ! ?`).
  - **Inférence Séquentielle sous Verrou CPU** : Le microservice FastAPI `/synthesize` synthétise chaque segment séquentiellement avec le modèle `Qwen3-TTS`.
  - **Concaténation Audio Binaire NumPy** : Insère un silence naturel de 250 ms entre les phrases et concatène l'ensemble des tableaux `np.concatenate(generated_wavs)` avant d'écrire le fichier binaire `.wav` final. Le fichier résultant couvre **100% de l'histoire du premier au dernier mot** sans aucune troncature de jetons.

### B. Routeur n8n Dynamique (`1RQWc4s1fNwDQkIj`)
- **Webhook d'entrée** : `https://n8n.srv856374.hstgr.cloud/webhook/d2d88f5d-78c0-49c1-83b8-096d4b21190c`
- **Nœud de décision (`Is VPS or Custom Voice?`)** :
  - Évalue `isCustomVoice === true` OU `provider === 'vps-hostinger'`.
  - Si **VRAI** : Oriente le flux vers le microservice VPS Hostinger (`http://31.97.40.49:8085/synthesize`) avec le header `X-API-Key`.
  - Si **FAUX** : Oriente le flux vers le fallback ElevenLabs.
- **Nœud d'upload Supabase (`upload-audio-from-n8n`)** :
  - Transmet le binaire audio généré par le VPS à `https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/upload-audio-from-n8n`.
  - Transmet le header d'authentification `x-webhook-secret: qpga8m5UFVedaXVf8D/coKlMoycSuA0qqFGk1UuvTQc=` qui valide la réception et fait passer le statut de `audio_files` de `pending`/`processing` à `ready`.

### C. Résilience Client & Expérience Utilisateur (PWA Calmi v1.3.11)
- **Supabase Realtime Channel** : Le hook [`useN8nAudioGeneration.ts`](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/src/hooks/story/audio/useN8nAudioGeneration.ts) s'abonne via WebSockets aux événements `postgres_changes` sur la table `audio_files`. Dès que le VPS valide le statut `ready`, l'interface met à jour le lecteur sans rechargement.
- **Écouteurs de Visibilité (`visibilitychange` / `focus`)** : Lorsque l'utilisateur quitte l'application ou verrouille son téléphone pendant la génération puis revient sur l'application, l'événement de visibilité déclenche un rafraîchissement immédiat en < 100ms depuis la base de données.
- **Bandeau de Production en Arrière-Plan Haute-Qualité (`IntegratedAudioDeck.tsx`)** :
  - Intégration d'un statut d'attente `isCheckingAudioStatus` prévenant tout saut d'interface au chargement.
  - Affichage d'une carte néon dorée/violette (`bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-slate-900/60`) avec badge rétro-éclairé **`[🎙️ Production du Livre Audio en cours... | Arrière-plan actif]`**.
  - Message explicite et rassurant indiquant que l'utilisateur peut fermer l'application et que la production continue sur le serveur.
- **Validation Automatisée** : Suite de tests Vitest dans [`src/__tests__/audio/audioGenerationPersistence.test.ts`](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/src/__tests__/audio/audioGenerationPersistence.test.ts) (8/8 tests passés avec succès).

---

## 4. Guide Opérationnel & Procédures v1.5.0 (Août 2026)

### A. Intégration des Standards Alexandria / Qwen3-TTS
1. **Prosodie des Échantillons Vocaux** : L'échantillon de référence (`ref_audio`) doit durer entre 5 et 15 secondes en format WAV 24 kHz mono et être enregistré avec de la **variation prosodique** (question -> insistance -> adoucissement). La transcription exact mot-à-mot (`ref_text`) est obligatoire.
2. **Consignes d'Acteur (`instruct`)** : Les instructions d'émotion et de rythme doivent impérativement être transmises en **anglais** (ex: `"Calm, soothing, warm bedtime storyteller for children. Soft, gentle pace."`), le modèle Qwen3-TTS ayant été entraîné sur des tokens de direction anglophones.
3. **Plafonnement des Chunks à 500 Chars** : La fonction `chunk_text(text, max_chars=500)` découpe le texte en segments de 500 caractères maximum **après** nettoyage des balises.
4. **Gate de Validation Qualité Audio RMS** : La fonction `validate_audio_signal()` contrôle le Root Mean Square et la durée minimale (≥ 0.5s) avant le retour HTTP 200 pour éliminer tout risque de livraison de fichiers corrompus ou silencieux.
5. **Support des Histoires Longues (5 min / 10 min / 15 min - Timeouts 3h/5h)** :
   - **Côté n8n (`Lecture audio VPS`)** : Le nœud *HTTP Request* (`http://31.97.40.49:8085/synthesize`) est configuré avec un timeout de **3 heures (`10 800 000 ms`)** via l'API n8n. Cela permet de tolérer l'inférence CPU complète (mesure réelle : ~52 min de calcul pour un conte de 10 min de lecture, ~1h20 pour 15 min).
   - **Côté Frontend (`useN8nAudioGeneration.ts`)** : `TIMEOUT_DURATION` est configuré à **5 heures (`18 000 000 ms`)** pour permettre l'attente silencieuse en arrière-plan sans bloquer l'utilisateur.

---

## 5. Architecture Multi-Catégories & Attribution Intelligente (Août 2026)

### A. Organisation par Sections Thématiques (5 Voix par Section)
Le Studio des Voix Familiales est structuré en **sections thématiques avec 5 slots chacune** :
1. 📖 **Narrateurs et famille** (`narrator_family`) : Voix de narration principale (Papa, Maman, Papy, Mamie, etc.).
2. 🐻 **Animaux terrestres** (`animal_land`) : Compagnons à 4 pattes (Ours, Renard, Chien, Loup, Chat, etc.).
3. 🦉 **Animaux volants et célestes** (`animal_flying`) : Créatures des airs (Chouette, Oiseau, Aigle, Dragon, etc.).
4. 🐬 **Animaux marins et aquatiques** (`animal_aquatic`) : Créatures océaniques (Dauphin, Baleine, Poisson, Sirène, etc.).
5. 👦👧 **Enfants** (`children`) : Petits héros et héroïnes des contes.
6. 👾 **Monstres et créatures magiques** (`magical_creatures`) : Monstres gentils, trolls, lutins, fées, robots.
7. ➕ **Catégories personnalisées** : Table `user_voice_categories` pour créer des sections sur-mesure (5 slots chacune).

### B. Règles Typographiques Françaises (UI & Design)
- **Casse de phrase obligatoire** : En français, ne pas mettre de majuscule à chaque mot pour les titres de sections ou de catégories (ex: *« Animaux terrestres »*, *« Monstres et créatures magiques »*, et non *« Animaux Terrestres »*).

### C. Moteur d'Attribution Intelligente des Voix (`storyAudioParser.ts`)
1. **Découpage Dialogue vs Narration** : Détecte les guillemets et tirets cadratins.
2. **Recherche par Correspondance Directe du Nom** : Si le dialogue ou son contexte immédiat mentionne le nom ou le rôle d'une voix enregistrée (ex: *« dit l'ours »* -> voix *Ours doux*), elle est attribuée en priorité.
3. **Recherche par Catégorie** : Si aucun nom précis ne correspond, associe le dialogue à la première voix active de la catégorie détectée (`animal_land`, `animal_flying`, `magical_creatures`, etc.).
4. **Fallback Narrateur** : Si aucune voix de cette catégorie n'existe, bascule automatiquement sur le Narrateur sélectionné.

### D. Procédure de Redéploiement sur le VPS Hostinger
En cas de modification du code Python du microservice `vps-tts-service`, la procédure exacte pour mettre à jour le conteneur Docker sur le VPS est :

```bash
# 1. Se placer dans le sous-dossier du microservice
cd ~/calmi-tts/vps-tts-service

# 2. Réinitialiser les éventuels fichiers locaux modifiés et tirer main
git reset --hard
git clean -fd
git pull origin main

# 3. Reconstruire l'image Docker sans cache et redémarrer
docker build --no-cache -t calmi-tts-service .
docker restart tts-service

# 4. Tester la réponse de santé (Le port 8085 de l'hôte redirige vers 8000 interne)
curl http://127.0.0.1:8085/health
```

### E. Évaluation Rapide A/B de Référence
Pour tester une nouvelle voix avant d'engager un livre audio complet :
```bash
python test_ab_voice.py --ref clone_voices/maman_sample.wav --text "Transcription exacte" --out test_maman.wav
```

---

## 6. Métriques, Simulations Réelles & Analyse des Coûts (VPS CPU vs Modal GPU)

### A. Synthèse Comparative des Mesures Réelles

| Métrique | VPS Hostinger KVM2 (CPU) | Modal.com Serverless (GPU NVIDIA L4) |
| :--- | :--- | :--- |
| **Durée calcul (Extrait court ~300 chars)** | ~1 à 2 minutes | **~5 à 10 secondes** |
| **Durée calcul (Histoire moyenne ~5 min)** | ~25 à 30 minutes | **~8 à 9 minutes** |
| **Durée calcul (Histoire longue 10 min, ~10 424 chars)** | **~50 à 55 minutes** (ratio 1:5) | **~16,9 à 17,9 minutes** *(~37 min avant optimisation des blocs)* |
| **Facteur d'accélération** | 1x (Base) | **~3x plus rapide que CPU** *(autorégressif)* |
| **Parallélisme / Simultanéité** | Séquentiel (1 histoire à la fois sous verrou) | **Illimité (Containers GPU instanciés à la volée)** |
| **Coût réel par histoire de 10 min** | Inclus dans le forfait VPS (~8-15 €/mois) | **0,00 €** *(couvert par les 30 $ USD / 41,50 $ CAD offerts/mois)* |
| **Coût unitaire brut hors crédit** | 0,00 € additionnel | **~0,23 $ USD (~0,32 $ CAD) / histoire longue de 10 min** |

### B. Impact du Multi-Voix (5 voix par section)
- **Temps & Coût identiques** : Le passage de 1 voix unique à 5 voix différentes (narrateur + animaux + créatures) ne modifie ni la durée totale de calcul ni le coût financier, car le modèle `Qwen3-TTS` permute simplement les tenseurs de voix en mémoire VRAM en ~2 ms par réplique.
- **Règle de dimensionnement** : Seul le nombre total de mots/caractères de l'histoire détermine le temps de calcul.

