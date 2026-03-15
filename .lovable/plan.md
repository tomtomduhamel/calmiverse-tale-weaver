

## Plan : Bouton "Copier le prompt" dans l'admin des prompts

Ajouter un bouton de copie discret à deux endroits dans `src/pages/admin/PromptAdmin.tsx` :

### 1. Zone d'édition (nouvelle version)
À côté du label "Contenu (nouvelle version)" (ligne 668), ajouter un petit bouton icône `Copy` qui copie `newVersionDraft.content` dans le presse-papiers.

### 2. Historique des versions (détails)
Dans chaque bloc version (ligne 708-715), à côté du `<summary>` "Voir le contenu", ajouter un bouton icône `Copy` qui copie `v.content` sans avoir besoin d'ouvrir le détail.

### Comportement
- Utiliser `navigator.clipboard.writeText()` 
- L'icône passe de `Copy` à `Check` pendant 2 secondes après copie (feedback visuel)
- Toast de confirmation "Prompt copié"
- Style : `Button variant="ghost" size="icon"` avec `h-7 w-7`, discret et aligné

### Fichier modifié
| Fichier | Changement |
|---------|-----------|
| `src/pages/admin/PromptAdmin.tsx` | Import `Copy, Check`. Ajouter état local `copiedId`. Fonction `handleCopy(content, id)`. Deux boutons icône aux emplacements décrits. |

Un seul fichier modifié, aucune dépendance ajoutée.

