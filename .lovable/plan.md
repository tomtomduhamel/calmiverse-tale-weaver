

## Problèmes identifiés

### 1. Erreurs de build (bloquent la publication)

**`ReadingPreferencesSection.tsx`** : Les imports sont dupliqués — lignes 9-10 et 25-26 importent les mêmes modules (`UserSettings`, `Snail`, `Turtle`, `Rabbit`, `RotateCcw`). Il faut fusionner en un seul bloc d'imports.

**`TitleBasedStoryCreator.tsx`** : Le code accède à `subscription.limits` (lignes 411, 414), mais `UserSubscription` n'a pas de propriété `limits`. Le hook `useSubscription` retourne `limits` comme un objet séparé, pas imbriqué dans `subscription`. Il faut utiliser `limits` directement depuis le hook.

### 2. Toggle vidéo magique — pourquoi il semble ne pas fonctionner

Le toggle fonctionne techniquement côté React (state `generateVideo`), mais deux problèmes pratiques :

- **Sur la capture d'écran** : le toggle est activé (vert) alors que le label dit "Réservé aux plans Calmix+" et qu'il y a un cadenas. Cela veut dire que `canGenerateVideo` est `false` (car `limits` est `null` à cause de l'erreur de build), donc le toggle devrait être disabled mais le state initial est `true`. Le `useEffect` qui désactive par défaut ne se déclenche jamais car `limits` est null.

- **Le compteur de vidéos restantes** n'affiche pas la bonne info car `videoQuota` reçoit des données depuis `subscription.limits` qui n'existe pas.

### 3. Ce que veut l'utilisateur

- Toggle vidéo magique fonctionnel et cliquable (activé/désactivé)
- Compteur de vidéos restantes affiché de manière sobre et élégante
- Design cohérent avec la thématique Calmi

---

## Plan de correction

### Étape 1 — Corriger `ReadingPreferencesSection.tsx`

Supprimer les imports dupliqués lignes 25-26 et fusionner `Lock` dans l'import lucide-react de la ligne 10.

### Étape 2 — Corriger `TitleBasedStoryCreator.tsx`

Remplacer `subscription.limits` par la variable `limits` retournée directement par `useSubscription()`. Le hook retourne déjà `{ subscription, limits, ... }` — il suffit de déstructurer `limits` et de l'utiliser :

```tsx
const { subscription, limits, loading: subLoading } = useSubscription();

// Puis dans le JSX :
limits={limits}
videoQuota={subscription ? {
  used: subscription.video_intros_used_this_period,
  limit: limits?.max_video_intros_per_period || 0
} : undefined}
```

### Étape 3 — Améliorer le compteur vidéo dans `MobileTitleSelector.tsx`

Remplacer le texte actuel par un compteur plus clair et élégant :

- Si l'utilisateur a le droit aux vidéos : afficher **"2 vidéos restantes sur 5"** avec une mini barre de progression subtile
- Si pas le droit : afficher **"Réservé aux plans Calmix+"** avec le cadenas (comme actuellement)
- Ajouter une petite icône d'étoile/lune pour rester dans la thématique Calmi

Le design restera dans le conteneur arrondi existant (`bg-primary/5 rounded-2xl`) avec des couleurs douces.

### Étape 4 — Même amélioration pour le desktop dans `TitleSelector.tsx`

Appliquer le même compteur élégant "X vidéos restantes sur Y" dans la version desktop.

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/settings/ReadingPreferencesSection.tsx` | Supprimer imports dupliqués |
| `src/components/story/title/TitleBasedStoryCreator.tsx` | Utiliser `limits` du hook au lieu de `subscription.limits` |
| `src/components/story/title/mobile/MobileTitleSelector.tsx` | Compteur vidéo restantes élégant |
| `src/components/story/title/TitleSelector.tsx` | Même compteur version desktop |

