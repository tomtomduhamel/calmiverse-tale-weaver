
## Diagnostic — cause racine identifiée

### Ce qu'Anthony voit
- **Écran 1** (vu comme "la couverture") : c'est en fait sa **bibliothèque** (`LibraryFeed` / `FeedCard`). Il voit la carte d'aperçu de « Le souffle de la forêt » (cover, durée, boutons Partager / Créer une suite). Sous celle-ci commence une autre carte « Écriture de votre aventure… » (un brouillon de 17/05 resté en `status: null`).
- **Écran 2** : après avoir tapé sur la carte, il atterrit sur l'écran d'erreur « Histoire non trouvée » du `StoryReaderPage`.

### Vérifications base de données
Compte `anthonyrenard5@hotmail.com` (id `f997ee22…`) → 4 histoires, dont **3 `completed` avec contenu valide** (`Le souffle de la forêt`, `Le duvet de la chouette`, `La plume sur l'oreiller`). Les données existent, la RLS est correcte (`auth.uid() = authorid`). Le problème n'est **pas** côté données.

### Cause racine — bug dans `src/App.tsx`

```tsx
// Ligne 250
<Route path="/reader/:id" element={<Navigate to="/app/reader/:id" replace />} />
```

Le composant `<Navigate>` de React Router **ne fait pas** d'interpolation des paramètres dynamiques. Quand on clique sur une carte d'histoire :

1. La navigation interne (`FeedCard`, `useStorySelection`, notifications, etc.) appelle `navigate('/reader/<uuid-réel>')`.
2. Cette route legacy redirige vers `'/app/reader/:id'` — **littéralement** la chaîne `:id`, pas l'UUID.
3. `StoryReaderPage` reçoit `useParams().id === ":id"`.
4. `stories.find(s => s.id === ":id")` → introuvable → **« Histoire non trouvée »**.

Ce bug touche **toutes** les histoires, pour **tous** les utilisateurs qui passent par les liens internes `/reader/:id` (FeedCard, Library, notifications PWA, ToastAction « Lire », `useStorySelection`, `ChatStoryCreator`, `CreateStoryTitles`, `StoryCompletionActions`, …). Anthony est juste le premier à le signaler clairement.

Pourquoi ça « marche parfois » : les rares appels qui ciblent directement `/app/reader/<id>` (peu nombreux) fonctionnent. Les PWA installées avec une ancienne version du bundle qui naviguait déjà en `/app/...` ne voient pas le bug — Anthony a rafraîchi la sienne.

---

## Plan d'action

### Étape 1 — Corriger la redirection paramétrée (fix principal)

Remplacer le `<Navigate>` cassé par un petit composant qui interpole correctement le paramètre :

```tsx
// src/components/routing/RedirectWithParams.tsx
const RedirectWithParams = ({ to }: { to: string }) => {
  const params = useParams();
  const resolved = Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`:${k}`, v ?? ''),
    to
  );
  return <Navigate to={resolved} replace />;
};
```

Puis dans `src/App.tsx` :

```tsx
<Route path="/reader/:id" element={<RedirectWithParams to="/app/reader/:id" />} />
```

Appliquer la même logique aux autres redirections paramétrées si on en ajoute par la suite (`/shared/:token`, etc.).

### Étape 2 — Faire pointer toutes les navigations internes directement vers `/app/reader/:id`

La redirection legacy ne doit servir **que** pour les anciens liens (emails, PWA pré-refonte, partages externes). Les composants internes doivent éviter le ricochet :

- `src/hooks/navigation/useAppNavigation.ts` → `navigateToStory` : `/reader/${id}` → `/app/reader/${id}`
- `src/components/library/LibraryFeed.tsx` (lignes 89, 114)
- `src/components/library/feed/FeedContainer.tsx` (ligne 53)
- `src/pages/Library.tsx` (lignes 55, 64)
- `src/pages/CreateStoryTitles.tsx` (ligne 43)
- `src/components/story/chat/ChatStoryCreator.tsx` (ligne 106)
- `src/hooks/notifications/useNotificationHandlers.ts` (ligne 111)
- `src/hooks/stories/useStoryNotifications.tsx` (lignes 61, 101)
- `src/services/stories/StoryCompletionActions.ts` (ligne 110)

Centralisation : ajouter une constante `READER_PATH = (id: string) => `/app/reader/${id}`` dans `src/lib/config.ts` ou `useAppNavigation` et l'utiliser partout, pour éviter la régression.

### Étape 3 — Durcir `StoryReaderPage` (défense en profondeur)

Dans `src/pages/StoryReaderPage.tsx` :
- Valider que `id` ressemble à un UUID (regex). Si non → log + redirection immédiate vers `/app/library` au lieu d'afficher « Histoire non trouvée ».
- Quand `stories.length > 0` et story introuvable, faire un **fallback fetch direct** : `supabase.from('stories').select('*').eq('id', id).maybeSingle()` avant de conclure à l'erreur (couvre le cas d'un cache obsolète après création récente).
- Améliorer le message d'erreur final : distinguer « id invalide », « histoire supprimée », « pas d'accès » pour faciliter le support futur.

### Étape 4 — Nettoyer le brouillon orphelin d'Anthony

L'histoire `0feafabe-3348-4d5f-8d9b-3674a881fd72` (status `null`, content vide, titre vide) pollue son fil. À supprimer via migration ciblée ou à proposer dans une future passe « ménage des histoires fantômes » (job planifié qui supprime les stories sans status et sans contenu après 24 h).

### Étape 5 — Validation

1. Test manuel dans la preview : ouvrir `/library`, cliquer sur chaque carte → arrivée sur le lecteur sans erreur.
2. Test du lien legacy : aller manuellement sur `/reader/<uuid>` → doit rediriger vers `/app/reader/<uuid>` avec l'UUID préservé.
3. Vérifier les logs `[StoryReaderPage]` dans la console pour confirmer la résolution.
4. Demander à Anthony de forcer la mise à jour de sa PWA (vider le cache ou désinstaller/réinstaller) puis ré-ouvrir une histoire.

### Étape 6 — Message à Anthony après déploiement

> « C'était un bug de routage côté app, identifié et corrigé : tous les liens internes vers une histoire renvoyaient vers une URL non résolue. Fais une mise à jour de l'app (tire-vers-le-bas pour rafraîchir, ou ferme/rouvre la PWA) — tes 3 histoires sont intactes et redeviennent accessibles. »

---

## Détails techniques (annexe)

- React Router v6 : `<Navigate to="...">` accepte une string statique ou un `To` object ; aucune interpolation `:param`. La résolution doit être faite manuellement via `useParams` + `generatePath` ou string-replace.
- Alternative à l'étape 1 : utiliser `generatePath` de `react-router-dom` :
  ```tsx
  const { id } = useParams();
  return <Navigate to={generatePath('/app/reader/:id', { id: id! })} replace />;
  ```
- Aucun changement de schéma DB, aucune Edge Function impactée, aucune migration nécessaire (sauf nettoyage optionnel de l'étape 4).
