

## Plan : Bouton "Marquer comme lue" en fin d'histoire

### Approche retenue

Placer le bouton directement **sous la section de notation** (StoryRating), dans le même Card, séparé par un `border-t`. Le design reprendra le style sobre du bloc de notation : un conteneur arrondi `bg-primary/5` avec l'icône BookCheck/BookOpen et le texte, centré. Cela crée une continuité visuelle naturelle : histoire → noter → marquer comme lue.

### Modifications

**1. `StoryReaderContent.tsx`** — Ajouter les props nécessaires (`onMarkAsRead`, `isRead`, `isUpdatingReadStatus`, `storyId`) et rendre le `MarkAsReadButton` (version non-compact, avec texte) après le bloc StoryRating :

```tsx
{/* Marquer comme lue */}
<div className="mt-6 pt-6 border-t border-border flex justify-center">
  <MarkAsReadButton
    storyId={story.id}
    onMarkAsRead={onMarkAsRead}
    isRead={isRead}
    isUpdatingReadStatus={isUpdatingReadStatus}
    isDarkMode={isDarkMode}
  />
</div>
```

**2. `StoryReader.tsx`** — Passer les props `onMarkAsRead`, `isRead`, `isUpdatingReadStatus` à `StoryReaderContent`.

Deux fichiers modifiés, aucun nouveau composant.

