

## Analyse des problemes iOS

D'apres les screenshots et le code :

### Probleme 1 : Dialog "Accepter l'histoire" coupe par le menu bottom
Le `DialogContent` est positionne en `fixed top-[50%] translate-y-[-50%]` avec `max-h-[90vh]`. Sur iPhone, avec beaucoup de personnages a mapper, le bas du dialog passe derriere le menu mobile (fixe en `z-[100]`). Le `pb-safe` ajoute du padding pour le home indicator mais pas pour le menu mobile lui-meme (56px + safe area).

**Solution** : Reduire le `max-h` du dialog a `max-h-[85vh]` et s'assurer que le footer reste toujours visible en separant le scroll du contenu (scroll uniquement sur la liste de personnages, pas sur le footer).

### Probleme 2 : Padding horizontal asymetrique dans la bibliotheque
Le Shell utilise `px-1` sur mobile (4px), ce qui est trop peu et cree une asymetrie visuelle. Sur Android ca passe car le rendu differe legerement.

**Solution** : Changer `px-1` en `px-3` dans le Shell pour un padding horizontal de 12px symetrique sur mobile.

### Probleme 3 : FeedbackButton chevauche le menu
Le bouton Feedback utilise `bottom-20` (80px) sur mobile, ce qui ne tient pas compte du safe area iOS.

**Solution** : Ajouter le safe area au positionnement du bouton feedback.

## Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/Shell.tsx` | `px-1` → `px-3` pour padding mobile symetrique |
| `src/components/story/share/SharedStoryAcceptDialog.tsx` | Restructurer : scroll sur le contenu uniquement, footer fixe en bas du dialog, `max-h-[85vh]` |
| `src/components/feedback/FeedbackButton.tsx` | Ajouter safe area au `bottom` mobile |
| `src/components/ui/dialog.tsx` | Aucune modification (les changements restent au niveau composant) |

### Detail SharedStoryAcceptDialog

Structure actuelle (problematique) :
```
DialogContent (max-h-[90vh], overflow-y-auto) ← tout scrolle, footer inclus
  DialogHeader
  contenu + personnages
  DialogFooter ← se retrouve cache
```

Structure corrigee :
```
DialogContent (max-h-[85vh], flex flex-col, NO overflow)
  DialogHeader (shrink-0)
  div (flex-1, overflow-y-auto) ← seul le contenu scrolle
  DialogFooter (shrink-0, sticky) ← toujours visible
```

