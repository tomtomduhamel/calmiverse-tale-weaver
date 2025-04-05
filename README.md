
# Calmiverse Tale Weaver

Application de génération d'histoires personnalisées pour enfants avec intelligence artificielle.

## À propos du projet

Calmiverse Tale Weaver est une application qui permet de créer des histoires personnalisées pour enfants en utilisant l'intelligence artificielle.

## URL du projet

**Production**: [https://calmi-99482.web.app](https://calmi-99482.web.app)

## Technologies utilisées

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Firebase (Hosting, Functions, Firestore)
- OpenAI

## Développement local

### Prérequis

- Node.js 20 ou supérieur
- npm 9 ou supérieur

### Installation

1. Clonez le dépôt:
```sh
git clone <YOUR_GIT_URL>
cd calmiverse-tale-weaver
```

2. Installez les dépendances:
```sh
npm install
cd functions
npm install
cd ../functions-v2
npm install
cd ..
```

3. Configurez les variables d'environnement:
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez votre clé API OpenAI: `OPENAI_API_KEY=votre_clé_api`

4. Lancez le serveur de développement:
```sh
npm run dev
```

## Déploiement

Le déploiement est automatisé via GitHub Actions. Les pushes vers la branche `main` déclenchent un déploiement en production.

Pour déployer manuellement:

```sh
npm run build
firebase deploy
```

## Comment contribuer

Consultez notre [Guide de contribution](CONTRIBUTING.md) pour plus d'informations.

## License

Ce projet est sous licence [MIT](LICENSE).
