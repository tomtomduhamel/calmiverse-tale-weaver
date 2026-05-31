# Utiliser une image de base Python légère
FROM python:3.10-slim

# Éviter d'écrire des fichiers bytecode (.pyc) et configurer le buffering de sortie log
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installer les dépendances système requises pour le traitement audio
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Créer un dossier temporaire pour la synthèse et lui attribuer les droits
RUN mkdir -p /app/temp && chmod 777 /app/temp

# Installer PyTorch pré-compilé pour CPU uniquement (très léger comparé à CUDA)
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Copier le fichier des dépendances Python
COPY requirements.txt .

# Installer les dépendances de l'application
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source dans le conteneur
COPY main.py .

# Exposer le port de l'application FastAPI
EXPOSE 8000

# Variable d'environnement pour le jeton de sécurité de Calmi
# À REDÉFINIR lors du lancement du conteneur (ex: docker run -e TTS_API_KEY=...)
ENV TTS_API_KEY="calmi_secure_token_change_me"

# Lancer le serveur uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
