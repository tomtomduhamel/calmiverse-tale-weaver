

## Plan : Bloc unifié "Vos crédits ce mois"

Fusionner le compteur d'histoires et le compteur de vidéos magiques dans un seul bloc compact sur la page de sélection des titres.

### Résultat visuel

```text
┌─────────────────────────────────────┐
│  Vos crédits ce mois                │
│  📖 Histoires  ████████░░  7/10     │
│  🎬 Vidéos     ██████░░░░  2/5  [⚙]│
└─────────────────────────────────────┘
```

Le toggle vidéo reste intégré sur la ligne vidéos. Le bloc conserve le style existant (`bg-primary/5 rounded-2xl border border-primary/10`).

### Modifications

**1. `TitleBasedStoryCreator.tsx`**
- Ajouter une prop `storyQuota: { used: number; limit: number }` construite à partir de `subscription.stories_used_this_period` et `limits.stories_per_month`, passée à `TitleSelector`.

**2. `TitleSelector.tsx`**
- Accepter `storyQuota` en prop, la transmettre à `MobileTitleSelector`.
- Remplacer le bloc vidéo desktop par un bloc unifié avec deux lignes : histoires (icône `BookOpen`, barre, "X/Y") et vidéos (icône `Video`, barre, "X/Y", toggle).

**3. `MobileTitleSelector.tsx`**
- Accepter `storyQuota` en prop.
- Remplacer le bloc vidéo mobile par le même bloc unifié compact : titre "Vos crédits ce mois", ligne histoires, ligne vidéos avec toggle.

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/story/title/TitleBasedStoryCreator.tsx` | Passer `storyQuota` prop |
| `src/components/story/title/TitleSelector.tsx` | Bloc unifié desktop + transmettre prop |
| `src/components/story/title/mobile/MobileTitleSelector.tsx` | Bloc unifié mobile |

Aucun nouveau composant, aucune requête supplémentaire.

