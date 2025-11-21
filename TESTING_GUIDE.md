# 🧪 Guide de Tests Complet - Calmiverse
## Phase 7 : Suite de Tests pour Éliminer l'Écran Blanc

Ce document définit tous les tests critiques pour garantir **0% d'écrans blancs** sur Calmiverse.

---

## 🎯 Objectifs de Tests

1. **Aucun écran blanc** - L'application affiche toujours du contenu visible
2. **Boot rapide** - React monte en <3s sur mobile 4G
3. **Résilience maximale** - Fonctionne même avec storage bloqué, réseau lent, Supabase down
4. **Feedback permanent** - L'utilisateur sait toujours ce qui se passe

---

## ✅ Test 1 - Mobile Preview Lovable (CRITIQUE)

**Objectif** : Vérifier que l'écran blanc n'apparaît jamais en preview mobile

### Procédure
1. Ouvrir le projet Calmiverse dans Lovable
2. Cliquer sur l'icône "Mobile" au-dessus du preview
3. Ouvrir le preview sur un iPhone/Android réel
4. Observer le chargement initial

### Critères de Succès
- ✅ Loader visible immédiatement (fond gradient + spinner)
- ✅ Pas d'écran blanc à aucun moment
- ✅ Application charge en <5s
- ✅ Contenu s'affiche correctement

### Critères d'Échec
- ❌ Écran blanc même 1 seconde
- ❌ Message d'erreur storage
- ❌ Application ne charge jamais

### En cas d'échec
- Vérifier les logs console dans le preview
- Regarder si `__CALMI_PREVIEW_MODE` est bien détecté
- Confirmer que `safeStorage` utilise la mémoire

---

## ✅ Test 2 - Mobile Preview avec Réseau Très Lent

**Objectif** : Vérifier que le timeout adaptatif fonctionne (30s)

### Procédure
1. Ouvrir DevTools sur le preview mobile
2. Aller dans Network → Throttling → Slow 3G
3. Recharger l'application
4. Observer le comportement pendant 30 secondes

### Critères de Succès
- ✅ Loader reste visible pendant toute la durée
- ✅ Message informatif après 30s (si timeout)
- ✅ Bouton "Mode démo" apparaît
- ✅ Logs de diagnostic visibles dans l'UI d'erreur

### Critères d'Échec
- ❌ Écran blanc avant 30s
- ❌ Message d'erreur avant 30s
- ❌ Application crash

### Logs Attendus
```
[Boot] PREVIEW MODE - Ultra-tolérant activé
[Boot] Emergency timeout configuré: 30s (Mobile Preview)
[Boot] Début initialisation HTML
```

---

## ✅ Test 3 - Desktop Standard

**Objectif** : Vérifier que le comportement desktop n'est pas affecté

### Procédure
1. Ouvrir le projet sur desktop
2. Observer le chargement initial
3. Vérifier l'authentification
4. Tester la navigation

### Critères de Succès
- ✅ Application charge normalement
- ✅ Timeout à 10s (au lieu de 30s)
- ✅ Auth Supabase fonctionne
- ✅ localStorage utilisé (pas mémoire)

### Critères d'Échec
- ❌ Mode preview activé sur desktop
- ❌ Performance dégradée
- ❌ Auth ne fonctionne pas

### Logs Attendus
```
[Boot] STANDARD MODE
[Boot] Emergency timeout configuré: 10s (Desktop)
[SafeStorage] localStorage disponible
```

---

## ✅ Test 4 - Cycle Fermeture/Réouverture

**Objectif** : Vérifier la stabilité après plusieurs cycles

### Procédure
1. Ouvrir l'application mobile
2. Fermer complètement le navigateur
3. Attendre 10 minutes
4. Rouvrir l'application
5. Répéter 5 fois

### Critères de Succès
- ✅ Fonctionne à chaque ouverture
- ✅ Pas d'écran blanc
- ✅ Pas de crash sessionStorage
- ✅ Données persistées correctement (si possible)

### Critères d'Échec
- ❌ Écran blanc à la réouverture
- ❌ Service Worker bloqué
- ❌ Erreur storage

---

## ✅ Test 5 - localStorage + sessionStorage Bloqués

**Objectif** : Vérifier le fallback mémoire complet

### Procédure
1. Ouvrir DevTools → Application
2. Décocher "Enable local storage"
3. Décocher "Enable session storage"
4. Recharger l'application

### Critères de Succès
- ✅ Aucun crash
- ✅ Application charge avec fallback mémoire
- ✅ Logs console indiquent stockage mémoire
- ✅ Fonctionnalités de base fonctionnent

### Critères d'Échec
- ❌ Crash "localStorage is not defined"
- ❌ Écran blanc
- ❌ Erreur non gérée

### Logs Attendus
```
[SafeStorage] localStorage bloqué - utilisation mémoire uniquement
[SafeSessionStorage] sessionStorage bloqué - utilisation mémoire uniquement
[BootMonitor] Mode preview - stockage mémoire uniquement
```

---

## ✅ Test 6 - Mode Démo de Secours

**Objectif** : Vérifier que le mode démo fonctionne

### Procédure
1. Ouvrir l'application avec `?demo=1` dans l'URL
2. Observer le banner "Mode Démonstration"
3. Tester les fonctionnalités de base

### Critères de Succès
- ✅ Banner orange visible en haut
- ✅ Message "Données d'exemple uniquement"
- ✅ Bouton "Se connecter" présent
- ✅ Application utilisable (même sans Supabase)

### Critères d'Échec
- ❌ Banner n'apparaît pas
- ❌ Application tente de se connecter à Supabase
- ❌ Erreur auth

### Logs Attendus
```
[Calmi] MODE DÉMO ACTIVÉ - Données d'exemple uniquement
[App] Mode démo actif - Fonctionnalités limitées
```

---

## ✅ Test 7 - Timeout Forcé (Simulation Erreur)

**Objectif** : Vérifier l'UI d'urgence avec logs

### Procédure
1. Modifier `main.tsx` pour ajouter `await new Promise(r => setTimeout(r, 35000))` avant le render
2. Ouvrir le preview mobile
3. Attendre 30 secondes

### Critères de Succès
- ✅ Loader visible pendant 30s
- ✅ Message d'erreur s'affiche après 30s
- ✅ Derniers logs visibles dans l'UI
- ✅ Bouton "Mode démo" disponible
- ✅ Diagnostic complet affiché

### Logs Attendus dans l'UI
```
• Début initialisation HTML
• BUILD_ID: BUILD_1234567890
• Configuration storage terminée
• Configuration error handlers
• DOM complètement chargé
• Configuration timeout: 30s
• TIMEOUT atteint après 30s
```

---

## ✅ Test 8 - Service Worker Stuck

**Objectif** : Vérifier que SW ne bloque jamais le boot

### Procédure
1. Ouvrir l'application desktop
2. DevTools → Application → Service Workers
3. "Stop" le service worker actif
4. Recharger l'application

### Critères de Succès
- ✅ Application charge quand même
- ✅ SW reset en arrière-plan
- ✅ Pas de blocage du montage React

### Logs Attendus
```
[SW-Reset] 🔄 Vérification reset Service Worker...
[SW-Reset] 🧹 Nettoyage complet détecté nécessaire
[SW-Reset] ✅ Reset complet terminé
```

---

## ✅ Test 9 - Performances Boot Mobile

**Objectif** : Mesurer le Time to Interactive (TTI)

### Procédure
1. Ouvrir le preview mobile
2. Regarder les logs `[Boot]` dans la console
3. Noter le temps total de boot

### Critères de Succès
- ✅ Time to First Paint < 1s
- ✅ React mounted < 3s
- ✅ Time to Interactive < 5s
- ✅ Aucune étape > 2s

### Métriques Attendues
```
[Boot] main.tsx: Starting (+0ms)
[Boot] React: Mounted successfully (+2500ms)
[Boot] React mount completed (2500ms)
[Boot] Total time: 4800ms
```

---

## ✅ Test 10 - Logs de Diagnostic Complets

**Objectif** : Vérifier que tous les logs critiques sont capturés

### Procédure
1. Ouvrir l'application
2. Inspecter `window.__CALMI_BOOT_LOGS`
3. Vérifier `window.__CALMI_BOOT_MONITOR`

### Critères de Succès
- ✅ Au moins 10 logs de boot capturés
- ✅ BootMonitor accessible globalement
- ✅ Durées mesurées pour chaque étape
- ✅ Étapes lentes identifiées (>1s)

### Commandes Console
```javascript
// Voir tous les logs HTML
console.table(window.__CALMI_BOOT_LOGS);

// Voir le rapport boot React
window.__CALMI_BOOT_MONITOR.report();

// Récupérer les derniers logs
window.__CALMI_BOOT_MONITOR.getLastStages(10);
```

---

## 📊 Métriques de Succès Globales

### Taux de Réussite Attendus
- **Écran blanc** : 0% (tolérance zéro)
- **Boot < 3s** : 95% (mobile 4G)
- **Boot < 5s** : 99% (mobile 3G)
- **Fallback fonctionnel** : 100%

### KPIs Critiques
| Métrique | Cible | Critique |
|----------|-------|----------|
| Time to First Paint | < 1s | < 2s |
| React Mount Time | < 3s | < 5s |
| Time to Interactive | < 5s | < 8s |
| Taux d'écran blanc | 0% | 0% |
| Crash rate storage | 0% | 0% |

---

## 🔧 Outils de Debug

### Logs Console Critiques
```javascript
// Vérifier le mode détecté
console.log(window.__CALMI_PREVIEW_MODE); // true/false

// Vérifier le mode démo
console.log(window.__CALMI_DEMO_MODE); // true/undefined

// Voir l'état du storage
const info = safeStorage.getStorageInfo();
console.log(info); // { type: 'localStorage' | 'memory', isPreviewMode: boolean }
```

### Commandes Manuelles
```javascript
// Forcer un reset SW
import { manualReset } from './utils/serviceWorkerReset';
await manualReset();

// Afficher le rapport boot
import { bootMonitor } from './utils/bootMonitor';
bootMonitor.report();

// Tester le mode démo
window.location.href = '/?demo=1';
```

---

## 🚨 Checklist Pre-Deployment

Avant chaque déploiement, vérifier :

- [ ] Test 1 (Preview mobile) passe
- [ ] Test 5 (Storage bloqué) passe
- [ ] Test 6 (Mode démo) passe
- [ ] Aucun log d'erreur critique dans console
- [ ] Time to Interactive < 5s sur mobile
- [ ] Toutes les features critiques fonctionnent

---

## 📞 Support & Troubleshooting

### Si écran blanc persiste
1. Vérifier les logs dans `window.__CALMI_BOOT_LOGS`
2. Regarder le rapport de `bootMonitor.report()`
3. Confirmer que `safeStorage` utilise le bon fallback
4. Tester avec `?demo=1` pour isoler le problème

### Contacts
- Documentation Lovable : https://docs.lovable.dev/
- Support : Via chat Lovable
- Guide troubleshooting : https://docs.lovable.dev/tips-tricks/troubleshooting

---

## 🎯 Résultat Attendu Final

Après tous ces tests, l'application doit :
- ✅ Afficher TOUJOURS quelque chose (jamais d'écran blanc)
- ✅ Charger en <3s sur mobile (95% des cas)
- ✅ Fonctionner même dans les pires conditions
- ✅ Fournir un feedback permanent à l'utilisateur
- ✅ Permettre un mode démo de secours

**Tolérance zéro pour les écrans blancs.**
