
# Guide Complet de Déploiement

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
- [ ] Clés API sécurisées
- [ ] Authentification validée
- [ ] Droits d'accès vérifiés
- [ ] Règles Firestore à jour

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

## Monitoring et Alertes

### Métriques Clés
- Temps d'exécution
- Taux d'erreur
- Utilisation mémoire
- Nombre de retries
- Compteur de mots
- Utilisation des tokens

### Seuils d'Alerte
- Temps d'exécution > 30s
- Taux d'erreur > 5%
- Utilisation mémoire > 80%
- Retries > 3

### Dashboard de Monitoring
- Métriques en temps réel
- Graphiques de performance
- Logs d'erreur
- Statistiques d'utilisation

## Procédures de Debug

### Erreurs Communes
1. **UNAUTHENTICATED**
   - Vérifier les tokens d'authentification
   - Contrôler les règles de sécurité

2. **OPENAI_ERROR**
   - Vérifier la clé API
   - Examiner les quotas
   - Contrôler le format des prompts

3. **TIMEOUT**
   - Vérifier la charge du système
   - Examiner les logs de performance
   - Ajuster les timeouts

### Logs et Diagnostics
- Utiliser `firebase functions:log`
- Examiner les métriques de StoryMetrics
- Vérifier les erreurs dans Firebase Console

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

## Support et Maintenance

### Contacts
- Support Technique: tech-support@team.com
- Équipe DevOps: devops@team.com
- Urgences: emergency@team.com

### Documentation
- Wiki Technique: /wiki/tech
- Guide API: /docs/api
- Procédures: /docs/procedures

