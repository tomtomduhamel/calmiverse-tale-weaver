# Guide de Déploiement : Service TTS Privé sur Hostinger VPS KVM2

Ce dossier contient l'ensemble des fichiers nécessaires pour faire tourner votre propre serveur de synthèse vocale avec clonage de voix **Zero-Shot** (Qwen3-TTS-0.6B) sur votre serveur VPS **Hostinger KVM2**.

---

## 📋 Prérequis sur le VPS Hostinger

1. **Système d'exploitation :** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (recommandé).
2. **Docker installé :** Si Docker n'est pas encore installé sur votre VPS, exécutez les commandes suivantes en SSH sur votre serveur :
   ```bash
   # Mise à jour des paquets
   sudo apt update && sudo apt upgrade -y

   # Installation de Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Vérifier l'installation
   docker --version
   ```

---

## 🚀 Étape 1 : Copier les fichiers sur le VPS

Vous devez copier ce dossier `vps-tts-service` sur votre VPS. 
Vous pouvez le faire en utilisant un client FTP (comme FileZilla en mode SFTP avec les identifiants de votre VPS Hostinger) ou en créant directement les fichiers sur le serveur.

Par exemple, créez un dossier sur le VPS :
```bash
mkdir -p ~/calmi-tts
cd ~/calmi-tts
```
Et déposez-y :
- `Dockerfile`
- `requirements.txt`
- `main.py`

---

## 🏗️ Étape 2 : Construire l'image Docker

Une fois dans le dossier contenant les fichiers sur votre VPS, lancez la construction de l'image Docker. Cette étape peut prendre quelques minutes car elle télécharge et compile l'environnement Python léger pour CPU (PyTorch CPU).

```bash
docker build -t calmi-tts-service .
```

---

## 🏁 Étape 3 : Lancer le conteneur

Pour lancer le service de façon persistante en arrière-plan, utilisez la commande suivante. 
**IMPORTANT :** Remplacez `VOTRE_CLE_API_SECURISEE_ICI` par un mot de passe fort et unique (qui servira à sécuriser l'accès à votre API pour que seul Calmi puisse l'appeler).

```bash
docker run -d \
  --name tts-service \
  -p 8000:8000 \
  -e TTS_API_KEY="VOTRE_CLE_API_SECURISEE_ICI" \
  --restart unless-stopped \
  calmi-tts-service
```

### 🔍 Vérification du bon fonctionnement :
Pour s'assurer que le service tourne correctement et que le modèle s'est chargé sur votre CPU, affichez les logs :
```bash
docker logs -f tts-service
```
Vous devriez voir s'afficher :
`📦 Chargement du modèle Qwen/Qwen3-TTS-0.6B-Base sur CPU...`
puis quelques instants plus tard (le temps du téléchargement initial des poids du modèle depuis Hugging Face) :
`✅ Modèle chargé avec succès en XX.XX secondes !`

---

## 🔒 Étape 4 : Sécuriser l'accès avec HTTPS (Recommandé)

Pour que Supabase (Edge Functions) puisse appeler votre VPS en toute sécurité, il est fortement recommandé d'exposer le port `8000` sous un nom de domaine avec un certificat SSL gratuit (Let's Encrypt).

### Option A : Utilisation de Nginx (Classique)
1. Installez Nginx sur le VPS :
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```
2. Créez un fichier de configuration Nginx pour votre sous-domaine (ex: `tts.calmi.fr`) dans `/etc/nginx/sites-available/tts-calmi` :
   ```nginx
   server {
       listen 80;
       server_name tts.calmi.fr; # Remplacez par votre domaine

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Activez le site et redémarrez Nginx :
   ```bash
   sudo ln -s /etc/nginx/sites-available/tts-calmi /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. Obtenez le certificat HTTPS SSL gratuit :
   ```bash
   sudo certbot --nginx -d tts.calmi.fr
   ```

---

## 📡 Endpoints de l'API à appeler depuis Supabase/n8n

Une fois votre serveur lancé et exposé sur `https://tts.calmi.fr` :

### 1. Test de bonne santé (Pas d'authentification requise)
*   **Méthode :** `GET`
*   **URL :** `https://tts.calmi.fr/health`

### 2. Synthèse et clonage de voix (Authentification requise)
*   **Méthode :** `POST`
*   **URL :** `https://tts.calmi.fr/synthesize`
*   **Headers :**
    *   `X-API-Key: VOTRE_CLE_API_SECURISEE_ICI`
    *   `Content-Type: application/json`
*   **Body (JSON) :**
    ```json
    {
      "text": "Bonjour, je suis Thomas. Je vous raconte aujourd'hui une magnifique histoire dans Calmi.",
      "voice_ref_url": "https://[votre-instance-supabase]/storage/v1/object/public/voice-clones/thomas.wav",
      "ref_text": "Optionnel: transcription exacte du fichier .wav de référence pour un meilleur rendu.",
      "language": "fr"
    }
    ```
*   **Réponse :** Un fichier binaire `.wav` contenant l'audio généré avec la voix clonée, prêt à être sauvegardé dans Supabase Storage.
