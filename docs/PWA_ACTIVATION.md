# Guide de Réactivation PWA - Calmi

## 📋 Contexte

La PWA (Progressive Web App) de Calmi est actuellement **désactivée** dans `vite.config.ts` (ligne 22-24).
Cette documentation explique comment la réactiver proprement avant les tests publics.

## 🎯 Pourquoi réactiver la PWA ?

Pour une application mobile-first comme Calmi, la PWA offre :

- ✅ **Installation sur l'écran d'accueil** (iOS/Android)
- ✅ **Mode hors-ligne** avec cache intelligent
- ✅ **Notifications push** natives
- ✅ **Performance optimale** avec Service Worker
- ✅ **Expérience native** sans passer par les stores

## 📝 Checklist de Réactivation

### 1. Activer la PWA dans la configuration

**Fichier : `vite.config.ts`** (lignes 22-24)

```typescript
// AVANT (désactivé)
...(false ? [
  VitePWA({
    registerType: 'autoUpdate',
    // ...
  })
] : []),

// APRÈS (activé)
...(true ? [  // ← Changer false en true
  VitePWA({
    registerType: 'autoUpdate',
    // ...
  })
] : []),
```

### 2. Vérifier la configuration du Service Worker

La configuration actuelle dans `vite.config.ts` est déjà optimale :

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
  runtimeCaching: [
    // Cache Supabase
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 }
      }
    },
    // Cache Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-cache' }
    },
    // Cache images externes
    {
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'external-images-cache',
        expiration: { maxEntries: 60, maxAgeSeconds: 2592000 }
      }
    }
  ]
}
```

### 3. Tester l'installation PWA

#### Sur Desktop (Chrome/Edge)
1. Ouvrir l'app en production
2. Vérifier l'icône d'installation dans la barre d'URL
3. Cliquer sur "Installer" et confirmer
4. Vérifier que l'app s'ouvre en fenêtre autonome

#### Sur Android (Chrome)
1. Ouvrir l'app sur mobile
2. Menu → "Ajouter à l'écran d'accueil"
3. Vérifier l'icône sur l'écran d'accueil
4. Lancer l'app et vérifier le mode standalone

#### Sur iOS (Safari)
1. Ouvrir l'app dans Safari
2. Partager → "Sur l'écran d'accueil"
3. Vérifier l'icône et le lancement
4. **Note** : iOS a des limitations PWA (pas de notifications push)

### 4. Tester le mode hors-ligne

1. Installer la PWA
2. Ouvrir DevTools → Application → Service Workers
3. Vérifier que le SW est actif
4. Activer "Offline" dans DevTools Network
5. Rafraîchir la page → doit charger depuis le cache
6. Vérifier que `/offline.html` s'affiche si pas de cache

### 5. Vérifier les performances

#### Outils de test :
- **Lighthouse** (DevTools → Lighthouse)
  - Score PWA > 90
  - Performance > 90
  - Accessibility > 90
- **PWA Builder** : https://www.pwabuilder.com/
- **Chrome DevTools** : Application → Manifest

#### Métriques cibles :
- First Contentful Paint (FCP) : < 1.5s
- Time to Interactive (TTI) : < 3.5s
- Service Worker : installé et actif

## 🛡️ Système de Récupération (Optionnel)

Si vous constatez des problèmes de boot après réactivation de la PWA, vous pouvez réintroduire un système de récupération **simplifié**.

### Option A : Système minimal (recommandé)

**Fichier : `index.html`** - Ajouter après le `window.load` :

```javascript
// Système de récupération ultra-simple
window.addEventListener('load', function(){
  localStorage.setItem('calmi_boot_ok', 'true');
  
  // Vérifier si l'app démarre (délai généreux de 60s)
  setTimeout(function(){
    var rootElement = document.getElementById('root');
    if (!rootElement || !rootElement.children.length) {
      console.error('[Boot] App non montée après 60s');
      // Rediriger vers recovery
      if (confirm('L\'application tarde à démarrer. Voulez-vous tenter une réparation ?')) {
        location.replace('/recovery.html');
      }
    }
  }, 60000); // 60 secondes
});
```

### Option B : Pas de système de récupération

Pour la majorité des cas, la PWA fonctionne parfaitement sans système de récupération. Les pages `/recovery.html` et `/offline.html` restent accessibles manuellement si besoin.

## 🧪 Tests de Validation

### Checklist finale avant publication :

- [ ] PWA activée dans `vite.config.ts`
- [ ] Build production réussi (`npm run build`)
- [ ] Installation PWA testée sur Desktop
- [ ] Installation PWA testée sur Android
- [ ] Installation PWA testée sur iOS Safari
- [ ] Mode hors-ligne fonctionnel
- [ ] Service Worker actif (DevTools)
- [ ] Score Lighthouse PWA > 90
- [ ] Aucun message d'erreur au boot
- [ ] Navigation fluide entre les pages
- [ ] Notifications activées (si applicable)

## 📊 Monitoring Post-Activation

### Métriques à surveiller :
1. **Taux d'installation** : % d'utilisateurs qui installent la PWA
2. **Erreurs Service Worker** : Console logs et Sentry
3. **Performance** : Lighthouse CI ou RUM (Real User Monitoring)
4. **Taux de rétention** : Utilisateurs qui reviennent après installation

### Outils recommandés :
- **Sentry** : Monitoring erreurs front + SW
- **Google Analytics 4** : Events d'installation PWA
- **Supabase Analytics** : Tracking usage API

## 🔧 Dépannage

### Problème : SW ne se met pas à jour
```bash
# Solution : Forcer la mise à jour
1. DevTools → Application → Service Workers
2. Cliquer "Unregister"
3. Rafraîchir la page
4. Vérifier nouveau SW installé
```

### Problème : Cache obsolète
```bash
# Solution : Clear storage
1. DevTools → Application → Clear Storage
2. Cocher "Unregister service workers"
3. Cocher "Cache storage"
4. Cliquer "Clear site data"
```

### Problème : Installation ne propose pas
```bash
# Vérifier :
- manifest.json accessible
- HTTPS activé (requis PWA)
- Score Lighthouse PWA > 80
- Au moins 2 pages distinctes
```

## 📚 Ressources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

## 🚀 Timeline Recommandée

1. **J-7 avant tests publics** : Réactiver PWA en dev
2. **J-5** : Tests complets iOS/Android/Desktop
3. **J-3** : Deploy staging avec PWA active
4. **J-1** : Validation finale performance
5. **J-Day** : Publication avec PWA active

---

**Dernière mise à jour** : 2025-01-20  
**Statut PWA actuel** : ❌ Désactivée  
**Prochaine activation** : Avant tests publics
