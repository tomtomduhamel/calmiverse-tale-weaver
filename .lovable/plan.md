## Ce qui se passe

Anthony n’est plus bloqué par la création d’histoire : ses histoires sont bien créées en base, avec couverture et contenu.

Les captures montrent deux éléments importants :

- La bibliothèque affiche correctement la nouvelle histoire `Le bercement des vagues`, avec couverture, titre, statut terminé, temps de lecture et date récente.
- Au clic, l’application ouvre l’écran `Histoire non trouvée` sur une URL `calmistory.com/a...`, ce qui correspond au lecteur qui reçoit un identifiant invalide, absent ou mal résolu.

La base confirme qu’Anthony possède bien plusieurs histoires valides :

- `Le secret du tiroir fermé` : `completed`, contenu présent
- `Le bercement des vagues` : `completed`, contenu présent
- `Le souffle de la forêt` : `completed`, contenu présent
- `Le duvet de la chouette` : `completed`, contenu présent
- `La plume sur l'oreiller` : `completed`, contenu présent

Donc le problème n’est pas la génération, ni la couverture, ni les données Supabase. C’est un problème d’accès au lecteur.

## Cause probable principale

Le correctif précédent est bien présent dans le code publié : la route legacy `/reader/:id` redirige maintenant vers `/app/reader/:id` avec interpolation correcte.

Mais le lecteur reste fragile : `StoryReaderPage` ne lit l’histoire que depuis la liste globale `useSupabaseStories()`. Si cette liste est vide, pas encore hydratée, filtrée, désynchronisée, ou si la PWA/Chrome garde un ancien état, le lecteur conclut trop vite à `Histoire non trouvée`.

Concrètement :

1. La bibliothèque utilise `useInfiniteStories`, qui charge bien les histoires d’Anthony.
2. Le lecteur utilise un autre hook, `useSupabaseStories`, avec son propre cache et son propre timing.
3. Si le lecteur s’ouvre avant que ce second hook ait chargé l’histoire ciblée, il ne fait aucun fetch direct par ID.
4. Il affiche alors `Histoire non trouvée`, même si l’histoire existe en base.

C’est pour cela qu’Anthony peut voir la carte et la couverture, mais ne pas accéder au texte.

## Cause aggravante observée

Sur la capture d’erreur, la barre de navigation mobile et le bouton Feedback restent visibles sur le lecteur. Or le `Shell` masque ces éléments seulement si l’URL commence par `/reader/`, pas `/app/reader/`.

Comme les liens pointent maintenant vers `/app/reader/:id`, le Shell ne reconnaît plus le mode lecteur. Cela ne cause pas directement `Histoire non trouvée`, mais confirme que la migration vers `/app/reader/:id` n’est pas complètement cohérente.

## Plan d’action définitif

### 1. Rendre le lecteur autonome

Modifier `StoryReaderPage` pour qu’il ne dépende plus uniquement de la liste globale des histoires.

Comportement attendu :

- Valider l’ID depuis l’URL.
- Chercher d’abord dans `stories` si elles sont déjà chargées.
- Si l’histoire n’est pas trouvée localement, faire une requête Supabase directe :
  - table `stories`
  - filtre `id = :id`
  - filtre `authorid = user.id`
  - `maybeSingle()`
- Formater la ligne avec `formatStoryFromSupabase`.
- Afficher seulement `Histoire non trouvée` après échec réel de cette requête directe.

Résultat : même si la liste globale est vide, en retard, ou désynchronisée, le lecteur ouvrira l’histoire depuis la base.

### 2. Corriger le mode lecteur dans le Shell

Modifier `Shell.tsx` pour reconnaître les deux chemins lecteur :

- `/reader/`
- `/app/reader/`

Puis utiliser ce booléen partout :

- masquer la navigation desktop
- masquer le menu mobile
- masquer le bouton Feedback
- retirer le padding bas de navigation

Résultat : l’écran lecteur redevient plein écran, propre, sans menus qui se superposent.

### 3. Corriger les anciennes sources de navigation restantes

Il reste encore des chemins `/reader/:id` dans :

- notifications service worker
- notifications persistées
- offline story queue
- story completion actions
- notification bell

Les corriger vers `/app/reader/:id`, ou les faire passer par une fonction centralisée `getReaderPath(storyId)`.

Résultat : plus aucun nouveau lien interne ne dépend de la route legacy.

### 4. Centraliser les chemins de navigation

Créer une petite fonction unique, par exemple :

```ts
export const getReaderPath = (storyId: string) => `/app/reader/${storyId}`;
```

Puis remplacer les URLs codées en dur.

Résultat : évite la régression lors des prochaines évolutions.

### 5. Améliorer le message d’erreur lecteur

Remplacer l’erreur générique par des cas distincts :

- ID invalide : retour bibliothèque
- histoire introuvable en base : supprimée ou aucun accès
- erreur réseau : proposer de réessayer
- session non chargée : garder l’état de chargement

Résultat : le support ne devra plus deviner si le problème vient du routage, du cache, de l’accès ou des données.

### 6. Ajouter un bouton de récupération cache/PWA visible en erreur

Sur l’écran d’erreur lecteur, ajouter une action secondaire :

- `Actualiser l'application`
- purge des caches via la logique existante `usePWA().reloadApp()` ou reset manuel existant

Résultat : si Anthony a encore une ancienne PWA ou un cache Chrome bloqué, il pourra corriger sans procédure technique.

### 7. Vérifier Anthony après correction

Après implémentation :

- tester `/app/reader/8e0c9e66-7987-4437-a66d-0051ff6e00a7`
- tester `/reader/8e0c9e66-7987-4437-a66d-0051ff6e00a7`
- tester clic depuis la bibliothèque
- vérifier que le lecteur n’affiche plus la barre mobile ni Feedback
- vérifier que les histoires Anthony sont toujours `completed` avec contenu

## Message à envoyer à Anthony après déploiement

> J’ai identifié le souci : tes histoires étaient bien créées, avec leur couverture et leur texte, mais l’application pouvait ouvrir le lecteur avant d’avoir rechargé la bonne histoire. Elle affichait alors à tort “Histoire non trouvée”. On corrige le lecteur pour qu’il récupère directement l’histoire depuis la base, même si le cache local n’est pas à jour. Tes histoires ne sont pas perdues.