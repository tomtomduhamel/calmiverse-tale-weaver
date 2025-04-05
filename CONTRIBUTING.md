
# Guide de contribution à Calmi

Ce document explique comment contribuer au projet Calmiverse Tale Weaver.

## Environnement de développement

### Prérequis
- Node.js 20 ou supérieur
- npm 9 ou supérieur
- Git

### Configuration du projet

1. Clonez le dépôt:
```bash
git clone https://github.com/votre-username/calmiverse-tale-weaver.git
cd calmiverse-tale-weaver
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

3. Configuration des clés API:
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez votre clé API OpenAI:
   ```
   OPENAI_API_KEY=votre-clé-api-openai
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
- Pour un déploiement en staging, nous prévoyons de configurer un workflow séparé (à venir)

## Tests

Avant de soumettre une Pull Request, assurez-vous que:

1. L'application se construit sans erreur (`npm run build`)
2. Les fonctionnalités ajoutées fonctionnent comme prévu
3. Les fonctionnalités existantes fonctionnent toujours correctement

## Questions et support

Pour toute question, créez une issue dans le dépôt GitHub ou contactez l'équipe de développement.
