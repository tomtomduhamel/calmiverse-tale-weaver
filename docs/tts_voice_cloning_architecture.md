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
