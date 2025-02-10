
# Guide Complet de Déploiement et Maintenance

## Configuration Pré-Déploiement

### Tests et Validation
- [ ] Tests unitaires passent (`npm test`)
- [ ] Tests d'intégration OpenAI passent
- [ ] Tests de charge complétés
- [ ] Vérification des types TypeScript (`npm run build`)
- [ ] Validation des clés API et secrets

### Configuration du Monitoring
- [ ] Seuils d'alerte configurés
- [ ] Dashboard de monitoring en place
- [ ] Métriques de performance activées
- [ ] Système de notification configuré

### Sécurité
- [ ] Clés API sécurisées dans Secrets Manager
- [ ] Authentification validée
- [ ] Droits d'accès vérifiés
- [ ] Règles Firestore à jour
- [ ] Validation des entrées implémentée

## Procédure de Déploiement

1. **Préparation**
   ```bash
   npm install
   npm run build
   npm test
   ```

2. **Vérification des Métriques**
   - Examiner les métriques actuelles
   - Vérifier les seuils d'alerte
   - Confirmer la configuration du monitoring

3. **Déploiement**
   ```bash
   firebase deploy --only functions
   ```

4. **Validation Post-Déploiement**
   - [ ] Test de génération d'histoire
   - [ ] Vérification des logs
   - [ ] Contrôle des métriques
   - [ ] Test des alertes
   - [ ] Validation des performances

## Monitoring et Alertes

### Métriques Clés
1. **Performance**
   - Temps d'exécution moyen
   - Temps de réponse 95e percentile
   - Utilisation mémoire
   - CPU usage

2. **Opérationnel**
   - Taux d'erreur
   - Nombre de retries
   - Requêtes concurrentes
   - Taux de succès

3. **Métier**
   - Nombre d'histoires générées
   - Longueur moyenne des histoires
   - Temps de génération moyen
   - Satisfaction utilisateur

### Seuils d'Alerte
1. **Critique (P1)**
   - Temps d'exécution > 30s
   - Taux d'erreur > 5%
   - Utilisation mémoire > 80%
   - Échecs consécutifs > 3

2. **Important (P2)**
   - Temps d'exécution > 20s
   - Taux d'erreur > 2%
   - Utilisation mémoire > 70%
   - Retries > 2

3. **Surveillance (P3)**
   - Temps d'exécution > 15s
   - Taux d'erreur > 1%
   - Utilisation mémoire > 60%

### Dashboard de Monitoring
- Métriques en temps réel
- Graphiques de performance
- Logs d'erreur
- Statistiques d'utilisation

## Guide de Debug

### Erreurs Communes

1. **UNAUTHENTICATED**
   ```
   Symptôme : Erreur 401
   Cause : Token invalide ou expiré
   Solution :
   1. Vérifier le token dans les logs
   2. Valider l'authentification
   3. Renouveler le token si nécessaire
   ```

2. **OPENAI_ERROR**
   ```
   Symptôme : Échec de génération
   Causes possibles :
   - Clé API invalide
   - Quota dépassé
   - Format de prompt incorrect
   Solution :
   1. Vérifier les logs OpenAI
   2. Valider la clé API
   3. Contrôler les quotas
   ```

3. **TIMEOUT**
   ```
   Symptôme : Requête > 30s
   Causes possibles :
   - Surcharge système
   - Problème réseau
   - OpenAI lent
   Solution :
   1. Vérifier les métriques système
   2. Analyser les logs de performance
   3. Ajuster les timeouts
   ```

4. **MEMORY_ERROR**
   ```
   Symptôme : OOM ou performance dégradée
   Solution :
   1. Vérifier l'utilisation mémoire
   2. Nettoyer les ressources
   3. Ajuster les limites
   ```

### Procédure de Debug

1. **Collecte d'Information**
   ```
   - ID de requête
   - Logs d'erreur
   - Métriques système
   - État des services
   ```

2. **Analyse**
   ```
   - Examiner les logs
   - Vérifier les métriques
   - Identifier les patterns
   ```

3. **Résolution**
   ```
   - Appliquer la solution
   - Valider la correction
   - Documenter l'incident
   ```

## Procédure de Rollback

1. **Identification du Problème**
   - Analyser les logs d'erreur
   - Examiner les métriques
   - Identifier la version stable

2. **Exécution du Rollback**
   ```bash
   firebase functions:rollback
   ```

3. **Validation Post-Rollback**
   - Vérifier la fonctionnalité
   - Contrôler les métriques
   - Valider les logs

## Maintenance Continue

### Tâches Quotidiennes
- Vérification des logs
- Analyse des métriques
- Validation des backups

### Tâches Hebdomadaires
- Analyse des performances
- Revue des incidents
- Mise à jour documentation

### Tâches Mensuelles
- Revue des seuils d'alerte
- Optimisation des ressources
- Test de disaster recovery

## Support et Contacts

### Équipe Technique
- Support N1: tech-support@team.com
- Support N2: devops@team.com
- Urgences: emergency@team.com

### Documentation
- Wiki Technique: /wiki/tech
- Guide API: /docs/api
- Procédures: /docs/procedures

## Annexes

### Commandes Utiles
```bash
# Logs
firebase functions:log

# Métriques
firebase functions:metrics

# Tests
npm run test:integration
npm run test:load

# Déploiement
firebase deploy --only functions:[functionName]
```

### Ressources
- Documentation Firebase
- Documentation OpenAI
- Guides internes
- Playbooks incidents
