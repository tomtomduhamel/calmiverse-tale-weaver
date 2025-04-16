
# Firebase Functions V2

Ce dossier contient les fonctions Firebase v2 pour l'application Calmi.

## Configuration requise

Pour que les déploiements fonctionnent correctement, assurez-vous de configurer les secrets GitHub suivants :

- `OPENAI_API_KEY` : Votre clé API OpenAI
- `FIREBASE_SERVICE_ACCOUNT` : Token d'authentification Firebase 
- `GOOGLE_APPLICATION_CREDENTIALS` ou `GOOGLE_APPLICATION_CREDENTIALS_JSON` : Identifiants du compte de service Google (pour accéder à Secret Manager)
- `GOOGLE_CLOUD_PROJECT` : (Optionnel) ID du projet Google Cloud, par défaut 'calmi-99482'

## Déploiement local

Pour déployer les fonctions depuis votre machine locale :

```bash
# Configurer les variables d'environnement
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/votre/fichier/service-account.json
export OPENAI_API_KEY=votre_clé_api_openai

# Déployer les fonctions
cd functions-v2
npm run build
firebase deploy --only functions:v2
```

## Fonctions disponibles

- `ping` : Teste la disponibilité du service et la connectivité avec OpenAI
- `generateStory` : Génère une histoire pour enfant basée sur des paramètres
- `retryFailedStory` : Réessaie de générer une histoire qui a échoué

## Troubleshooting

Si vous rencontrez des erreurs lors du déploiement :

1. Vérifiez que toutes les variables d'environnement sont correctement configurées
2. Vérifiez les permissions du compte de service Google
3. Assurez-vous que Secret Manager est activé sur votre projet
4. Si vous utilisez des secrets, vérifiez qu'ils sont créés dans Secret Manager

Pour les erreurs avec Secret Manager, vous pouvez basculer temporairement sur les variables d'environnement en définissant `OPENAI_API_KEY`.
