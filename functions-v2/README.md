
# Firebase Functions V2

Ce dossier contient les fonctions Firebase v2 pour l'application Calmi.

## Configuration requise

Pour que les déploiements fonctionnent correctement, assurez-vous de configurer les secrets GitHub suivants:

- `OPENAI_API_KEY` : Clé API OpenAI
- `FIREBASE_SERVICE_ACCOUNT` : Token d'authentification Firebase (au format JSON)
- `GOOGLE_CLOUD_PROJECT` : (Optionnel) ID du projet Google Cloud, par défaut 'calmi-99482'

## Structure du projet

```
functions-v2/
├── src/
│   ├── index.ts                  # Point d'entrée et exports des fonctions
│   ├── handlers/                 # Gestionnaires de fonctions
│   │   ├── ping.ts               # Fonction de test
│   │   └── story/                # Fonctions liées aux histoires
│   │       ├── generateStoryHandler.ts
│   │       └── retryStoryHandler.ts
│   └── services/                 # Services réutilisables
│       ├── secretManager.ts      # Gestion des secrets
│       └── ai/                   # Services d'IA
│           ├── openai-client.ts  # Client OpenAI
│           ├── story-prompt.ts   # Prompts pour génération d'histoires
│           └── story-formatting.ts # Formatage des histoires
└── lib/                          # Code compilé
```

## Déploiement local

Pour déployer les fonctions depuis votre machine locale :

```bash
# Configurer les variables d'environnement
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/votre/fichier/service-account.json
export OPENAI_API_KEY=votre_clé_api_openai

# Construire et déployer
cd functions-v2
npm run build
firebase deploy --only functions:v2
```

## Déploiement automatisé

Le déploiement est configuré via GitHub Actions avec le workflow `.github/workflows/deploy-functions-v2.yml`. Il peut être déclenché manuellement depuis l'onglet Actions de GitHub.

## Dépannage

Si vous rencontrez des problèmes lors du déploiement :

1. Vérifiez les journaux de GitHub Actions pour des messages d'erreur détaillés
2. Assurez-vous que le compte de service a les permissions nécessaires
3. Vérifiez que la variable `OPENAI_API_KEY` est correctement définie
4. Essayez un déploiement local pour obtenir des messages d'erreur plus détaillés

Pour tester la connectivité, utilisez la fonction `ping` qui vérifie :
- La connexion à Firebase
- L'accès à OpenAI
- La configuration des variables d'environnement
