

## Plan : Bouton "Copier le texte" dans les contrôles du reader

### Approche

Ajouter un bouton icône `Copy` dans le `ReaderControls`, intégré dans la barre d'outils existante (le panneau rétractable en bas). Le bouton copie `story.content` dans le presse-papiers avec feedback visuel (icône `Check` pendant 2s) et un toast de confirmation.

C'est l'emplacement idéal : discret par défaut (panneau masqué), accessible à la demande, cohérent avec les autres outils (audio, vitesse, musique, marquer lu).

### Résultat visuel

Desktop : un nouveau segment après "Lue" avec séparateur, icône `Copy` et label "Copier".
Mobile : une icône `Copy` ajoutée sur la ligne 2 (à côté de vitesse, musique, marquer lu).

### Modifications

**`src/components/story/ReaderControls.tsx`**
- Importer `Copy`, `Check` de lucide-react
- Ajouter état `isCopied` (boolean)
- Fonction `handleCopy` : `navigator.clipboard.writeText(story.content)` → toast → feedback 2s
- Desktop : nouveau segment avec séparateur + bouton après le bloc "Lue"
- Mobile : bouton icône compact ajouté sur la ligne 2

Un seul fichier modifié.

