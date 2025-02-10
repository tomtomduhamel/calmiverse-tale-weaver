
# Guide de Déploiement - Projet Calmi

Ce document décrit les bonnes pratiques et configurations de déploiement pour le projet Calmi.

## Structure du Projet

```
/
├── functions-v2/           # Répertoire des Cloud Functions
│   ├── src/               # Fichiers source TypeScript
│   ├── lib/               # JavaScript compilé (build)
│   ├── package.json       # Dépendances des functions (Node 20)
│   └── tsconfig.json      # Configuration TypeScript
├── .nvmrc                 # Version Node.js (20.17.0)
├── firebase.json          # Configuration Firebase
└── .github/workflows/     # Workflows de déploiement
```

## Versions et Compatibilité

### Node.js
- `.nvmrc`: 20.17.0
- `firebase.json`: runtime "nodejs20"
- GitHub Actions: node-version '20'
- `functions-v2/package.json`: engines.node "20"

⚠️ Ces versions doivent rester synchronisées pour éviter les problèmes de déploiement.

## Configuration Firebase

```json
{
  "functions": [{
    "source": "functions-v2",
    "codebase": "v2",
    "runtime": "nodejs20",
    "region": "us-central1"
  }]
}
```

### Points Importants
- Utilisation du codebase "v2"
- Région de déploiement: us-central1
- Source des functions: functions-v2

## Workflow de Déploiement

Le déploiement est automatisé via GitHub Actions avec les étapes suivantes:
1. Installation de Node.js (v20)
2. Installation des dépendances
3. Build du projet
4. Déploiement des functions

### Commandes Importantes
```bash
# Installation des dépendances
cd functions-v2 && npm install

# Build
npm run build

# Déploiement
firebase deploy --only functions
```

## Checklist de Déploiement

Avant chaque déploiement, vérifier:

### 1. Versions Node.js
- [ ] .nvmrc (20.17.0)
- [ ] firebase.json (nodejs20)
- [ ] GitHub Actions workflow (node-version: '20')
- [ ] functions-v2/package.json (engines.node: "20")

### 2. Chemins et Structure
- [ ] Utilisation cohérente de "functions-v2"
- [ ] Structure src/lib dans functions-v2
- [ ] Chemins corrects dans les scripts de build

### 3. Configuration Firebase
- [ ] Configuration v2 dans firebase.json
- [ ] Région us-central1
- [ ] Codebase "v2"

### 4. Workflow de Déploiement
- [ ] Déploiement --only functions
- [ ] Ordre: install → build → deploy
- [ ] Secrets GitHub Actions configurés

## Bonnes Pratiques

1. **Chemins Absolus**
   - Privilégier les chemins absolus dans les imports
   - Utiliser tsconfig.json pour la configuration des paths

2. **Documentation**
   - Documenter les changements de structure
   - Mettre à jour ce guide si nécessaire

3. **Tests**
   - Exécuter les tests avant le déploiement
   - Vérifier les logs après déploiement

4. **Sécurité**
   - Ne jamais commit de secrets
   - Utiliser les variables d'environnement GitHub Actions

## Résolution des Problèmes Courants

1. **Erreur de version Node.js**
   - Vérifier la synchronisation des versions
   - Utiliser nvm pour switcher vers la bonne version

2. **Échec du Build**
   - Vérifier les dépendances
   - Consulter les logs de build

3. **Échec du Déploiement**
   - Vérifier les permissions Firebase
   - Consulter les logs de déploiement

## Contact

Pour toute question concernant le déploiement, contacter l'équipe technique.
