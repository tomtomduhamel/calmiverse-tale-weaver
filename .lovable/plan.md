## Diagnostic

### Problème 1 — Le bouton "Mettre à jour" ne fait rien (visuellement)

Le bouton appelle `reloadApp()` dans `src/hooks/usePWA.ts` :

```ts
const reloadApp = () => {
  window.location.reload();
};
```

Or l'app tourne en PWA installée avec un Service Worker actif (Workbox `generateSW`, `skipWaiting: true`, `clientsClaim: true`). Trois choses se passent en pratique :

1. Quand un nouveau SW est détecté, le hook poste bien `SKIP_WAITING`, mais **immédiatement après** l'utilisateur clique sur "Mettre à jour" → on déclenche `location.reload()` **avant** que `controllerchange` ait basculé sur le nouveau SW. Résultat : l'ancien SW sert encore les anciens assets depuis le cache `html-nav` / `workbox-precache` → l'utilisateur recharge la même version, donc rien ne semble changer à l'écran (le bandeau "Mise à jour disponible" reste, et l'expérience visible est "rien ne se passe").
2. `reloadApp()` ne purge pas les caches Workbox ni n'attend `controllerchange`. Si le SW est bloqué en état `waiting` (par ex. autre onglet ouvert), `skipWaiting` n'est jamais réémis avant le reload.
3. Sur iOS standalone notamment, `location.reload()` peut être servi depuis le bfcache et ré-injecter l'ancien HTML précaché.

### Problème 2 — La version n'évolue jamais

`vite.config.ts` génère bien `public/version.json` à partir de `package.json` au `buildStart` :

```ts
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
fs.writeFileSync('public/version.json', JSON.stringify({ version: pkg.version }, null, 2));
```

Mais **rien ne bumpe `package.json`** entre deux déploiements Lovable. La version reste figée à `1.2.1` (vérifié : `package.json` = 1.2.1, `public/version.json` = 1.2.1, `APP_CONFIG.APP_VERSION` = 1.2.1).

Conséquences :
- `checkVersionFromServer()` compare toujours `1.2.1 === 1.2.1` → **ne déclenche jamais** `updateAvailable=true` par cette voie.
- Le bandeau "Mise à jour disponible" visible sur la capture vient en réalité de l'autre chemin : `navigator.serviceWorker.addEventListener('controllerchange', ...)` (déclenché par Workbox quand le nouveau SW prend la main).
- L'affichage "Version 1.2.1" dans `Footer` / `AboutPage` reste figé même après plusieurs publications.

Autre point : écrire dans `public/version.json` à `buildStart` modifie un fichier source versionné à chaque build, ce qui pollue le diff. Il vaut mieux écrire dans `dist/` via `generateBundle`.

---

## Plan de correction

### A. Bump automatique de la version à chaque build

1. **Modifier `versionJsonPlugin` dans `vite.config.ts`** :
   - Composer une version "build" = `pkg.version + "+" + buildId`, où `buildId` est :
     - `process.env.LOVABLE_BUILD_ID` ou `VERCEL_GIT_COMMIT_SHA` si présent,
     - sinon `Date.now().toString(36)` (timestamp court).
   - Écrire le résultat dans `dist/version.json` au hook `generateBundle` (et non plus dans `public/`), pour ne plus polluer les sources.
   - Injecter cette même valeur via `define: { __APP_VERSION__: JSON.stringify(fullVersion) }` pour qu'elle soit disponible côté client.

2. **Mettre à jour `src/lib/config.ts`** :
   - Remplacer `APP_VERSION: pkg.version` par `APP_VERSION: __APP_VERSION__` (avec déclaration TS `declare const __APP_VERSION__: string;` dans `vite-env.d.ts`).
   - Ainsi `Footer`, `AboutPage`, `checkVersionFromServer()` et `usePWA` voient une nouvelle valeur à chaque build, sans toucher manuellement `package.json`.

3. **Nettoyer `public/version.json`** : le supprimer du repo (devient un artefact de build). Mettre à jour le script de plugin pour ne plus toucher à `public/`.

### B. Réparer le flow de mise à jour

1. **Réécrire `reloadApp()` dans `src/hooks/usePWA.ts`** pour suivre la séquence correcte :
   ```text
   1. Récupérer la registration SW.
   2. Si reg.waiting → écouter 'controllerchange' UNE seule fois,
      puis postMessage({type:'SKIP_WAITING'}) au waiting worker.
   3. Dans le handler controllerchange → vider les caches Workbox
      (caches.keys() + caches.delete) puis window.location.reload().
   4. Fallback si pas de SW / pas de waiting : purger caches + reload direct.
   5. Timeout de sécurité 3 s : si controllerchange n'arrive pas,
      forcer caches.delete + reload quand même.
   ```

2. **Ajouter un état `isReloading`** exposé par le hook, pour que le bouton affiche un spinner ("Mise à jour en cours…") et empêche le double-clic.

3. **`PWAUpdateNotification` + `Settings`** :
   - Lier les boutons à la nouvelle version de `reloadApp` (signature inchangée).
   - Désactiver le bouton + afficher le spinner pendant `isReloading`.
   - Sur le countdown auto-reload de `PWAUpdateNotification`, appeler `reloadApp()` au lieu de `window.location.reload()` direct (le composant fait actuellement un reload brut, ce qui souffre du même bug).

4. **Sanity check côté SW** : `src/sw.ts` gère déjà `SKIP_WAITING`, mais la stratégie Vite est `generateSW` → ce fichier n'est pas utilisé. Workbox généré inclut déjà `skipWaiting: true` + `clientsClaim: true`, donc rien à modifier côté SW. Documenter ce point pour éviter la confusion future.

### C. Validation

1. Build local → vérifier `dist/version.json` contient bien une version unique (`1.2.1+abc123`).
2. Publier → recharger la PWA installée → le bandeau apparaît, clic "Mettre à jour" → vérifier dans les logs :
   - `[usePWA] 📨 Posting SKIP_WAITING`
   - `controllerchange` reçu
   - `[usePWA] Caches purged, reloading`
   - L'app revient sur la nouvelle version (Footer affiche la nouvelle valeur).
3. Re-tester sur mobile (Android Chrome + iOS Safari standalone).

---

## Fichiers impactés

- `vite.config.ts` — plugin version + `define`
- `src/vite-env.d.ts` — `declare const __APP_VERSION__`
- `src/lib/config.ts` — source de `APP_VERSION`
- `src/hooks/usePWA.ts` — nouveau `reloadApp` + `isReloading`
- `src/components/PWAUpdateNotification.tsx` — utiliser `reloadApp` pour l'auto-reload + état loading
- `src/pages/Settings.tsx` — état loading sur le bouton
- `public/version.json` — supprimé (devient artefact de build)
