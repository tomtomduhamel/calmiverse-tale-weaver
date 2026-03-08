

## Diagnostic

Le problème est clair : le formateur `storyFormatters.ts` (qui transforme les données Supabase en objets `Story`) ne mappe pas les champs `rating` et `rating_comment`. La requête Supabase utilise `select('*')` donc les données arrivent bien, mais elles sont perdues lors du formatage.

**Fichier concerné** : `src/hooks/stories/storyFormatters.ts`, ligne 36

**Cause racine** : Les champs `rating` et `rating_comment` sont absents du mapping dans `formatStoryFromSupabase()`.

## Plan de correction

### Modification unique : `src/hooks/stories/storyFormatters.ts`

Ajouter les deux champs manquants dans la fonction `formatStoryFromSupabase` :

```typescript
rating: story.rating || undefined,
rating_comment: story.rating_comment || undefined,
```

Ces deux lignes seront ajoutées juste après la ligne `next_story_id`, avant l'accolade fermante du return.

C'est une correction d'une seule ligne (deux champs). Aucune autre modification n'est nécessaire car :
- Le type `Story` inclut déjà `rating?` et `rating_comment?`
- Le composant `StoryRating` reçoit déjà `initialRating={story.rating}` et `initialComment={story.rating_comment}`
- Le hook `useStoryRating` sauvegarde correctement en base
- Le realtime listener utilise déjà `formatStoriesFromSupabase` donc la mise à jour sera aussi captée

