
# Guide de contribution à Calmi

Ce document explique comment contribuer au projet Calmi.

## Environnement de développement

### Prérequis
- Node.js 20 ou supérieur
- npm 9 ou supérieur
- Git

### Configuration du projet

1. Clonez le dépôt:
```bash
git clone https://github.com/votre-username/calmi.git
cd calmi
```

2. Installez les dépendances:
```bash
npm install
cd functions
npm install
cd ../functions-v2
npm install
cd ..
```

3. Configuration des variables d'environnement:
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez les variables nécessaires:
   ```
   # OpenAI
   OPENAI_API_KEY=votre-clé-api-openai
   
   # Firebase (optionnel - valeurs par défaut définies dans le code)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   
   # Webhooks (optionnel)
   VITE_EMAIL_WEBHOOK_URL=your_email_webhook_url
   VITE_KINDLE_WEBHOOK_URL=your_kindle_webhook_url
   ```

4. Lancez l'application en développement:
```bash
npm run dev
```

## Workflow Git

### Structure des branches

- `main`: Version de production, stable
- `develop`: Branche de développement principale
- `feature/*`: Pour les nouvelles fonctionnalités
- `bugfix/*`: Pour les corrections de bugs

### Processus de contribution

1. Créez une branche à partir de `develop`:
```bash
git checkout develop
git pull
git checkout -b feature/nom-de-votre-fonctionnalité
```

2. Faites vos modifications et commitez:
```bash
git add .
git commit -m "Description claire de vos modifications"
```

3. Poussez vers le dépôt distant:
```bash
git push -u origin feature/nom-de-votre-fonctionnalité
```

4. Créez une Pull Request vers la branche `develop`

5. Après révision et approbation, la Pull Request sera fusionnée

## Déploiement

Le déploiement est automatisé via GitHub Actions:

- Les commits sur la branche `main` déploient automatiquement vers l'environnement de production
- Les commits sur la branche `develop` déploient vers l'environnement de staging

## Sécurité

- Ne commitez jamais de secrets, clés API ou informations sensibles
- Utilisez les variables d'environnement pour les secrets
- Pour les déploiements, utilisez les secrets GitHub configurés dans les paramètres du dépôt

## Tests

Avant de soumettre une Pull Request, assurez-vous que:

1. L'application se construit sans erreur (`npm run build`)
2. Les fonctionnalités ajoutées fonctionnent comme prévu
3. Les fonctionnalités existantes fonctionnent toujours correctement

## Questions et support

Pour toute question, créez une issue dans le dépôt GitHub ou contactez l'équipe de développement.
