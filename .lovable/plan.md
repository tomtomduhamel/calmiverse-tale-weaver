

## Plan : Refonte mobile-first de la page admin des prompts

### Problemes identifies

1. **Layout 3 colonnes** (`grid-cols-3`) inutilisable sur mobile -- tout s'empile sans navigation claire
2. **Trop d'informations visibles simultanement** : metadata, editeur, historique des versions affichés en bloc
3. **Actions dangereuses trop accessibles** : changer la clé technique, activer une version, tout est au meme niveau sans confirmation
4. **Textarea d'edition trop petite** sur mobile (200px de hauteur fixe pour des prompts de 50+ lignes)

### Architecture proposee

Passer d'un layout sidebar + detail panel a une **navigation par etapes sur mobile** :

```text
MOBILE (< 768px)                    DESKTOP (>= 768px)
┌─────────────────┐                ┌────────┬──────────────────┐
│ Liste templates │  ← tap →      │ Liste  │ Detail panel     │
│ (plein ecran)   │                │ (side) │ (tabs internes)  │
└─────────────────┘                └────────┴──────────────────┘
        ↓ tap
┌─────────────────┐
│ Detail template │
│ avec bouton ←   │
│ (tabs: Contenu  │
│  / Versions /   │
│  Parametres)    │
└─────────────────┘
```

### Changements concrets

**`src/pages/admin/PromptAdmin.tsx`** -- refonte complete du rendu :

1. **Navigation mobile drill-down** : etat `mobileView: 'list' | 'detail'`. Sur mobile, afficher soit la liste soit le detail, avec un bouton retour (ChevronLeft).

2. **Tabs dans le detail** au lieu de tout empiler :
   - **Contenu** : textarea d'edition + changelog + bouton "Creer version" (l'action principale)
   - **Versions** : historique avec activation/copie (actions secondaires)
   - **Parametres** : metadata (titre, cle, description) -- separe pour eviter les erreurs

3. **Confirmation avant actions critiques** :
   - "Activer cette version" → dialog de confirmation avec le numero de version
   - Modification de la cle technique → avertissement visible

4. **Textarea responsive** : `min-h-[40vh]` sur mobile au lieu de 200px fixe

5. **Suppression de la legende** en haut (elle prend de la place et n'apporte rien une fois compris) -- le badge "En production" sur chaque item suffit

6. **Bouton "Nouveau" et "Initialiser"** regroupes dans un menu dropdown sur mobile pour liberer de l'espace

### Securite UX

- Les champs metadata (titre, cle technique, description) sont isoles dans un onglet "Parametres" pour eviter les modifications accidentelles
- Le bouton "Activer cette version" utilise un `AlertDialog` de confirmation
- Le banner vert "Ce prompt est utilise en production" reste visible en haut du detail

### Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/pages/admin/PromptAdmin.tsx` | Refonte du JSX : mobile drill-down, tabs, confirmation dialogs |

Un seul fichier modifie. Les composants UI necessaires (Tabs, AlertDialog) existent deja dans le projet.

