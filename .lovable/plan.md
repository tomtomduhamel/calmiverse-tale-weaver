

## Analyse des problemes

### Probleme 1 : Le placeholder affiche "JJ MMMM AAAA"
Le placeholder dans `DatePickerWithInput.tsx` (ligne 92) est `"JJ MMMM AAAA"` — c'est le format date-fns en francais (MMMM = mois en toutes lettres). Ce n'est pas un bug en soi mais c'est confus pour l'utilisateur qui s'attend a "JJ/MM/AAAA".

### Probleme 2 : Le calendrier ne s'ouvre pas au clic
Le composant imbrique un `<Input>` a l'interieur d'un `<Button>` qui sert de `PopoverTrigger`. Le `onClick={(e) => e.stopPropagation()}` sur l'Input (ligne 94) bloque la propagation du clic vers le Button/Popover. Resultat : cliquer sur le champ texte ne declenche pas l'ouverture du calendrier. Seul un clic sur l'icone calendrier (zone etroite du Button hors Input) pourrait l'ouvrir.

### Probleme 3 : Le YearView ne montre que 13 ans en arriere
`YearView` genere les annees de `currentYear - 12` a `currentYear` (lignes 9-11). Impossible de selectionner une annee avant 2014. Inutilisable pour un adulte de 70 ans (ne en 1956) ou meme un enfant de plus de 12 ans.

### Probleme 4 : Saisie manuelle fragile
L'Input attend un format `"dd MMMM yyyy"` en francais (ex: "12 mars 2026"). Tres difficile a saisir correctement sur mobile.

## Solution proposee

Remplacer entierement le composant `DatePickerWithInput` par un design simple et fiable :

**Supprimer l'Input imbrique.** Le Button affiche la date formatee (ou le placeholder). Un clic ouvre le Popover avec le flux Year → Month → Day.

**Refondre le YearView** pour couvrir une plage de 0 a 100 ans en arriere, avec navigation par decades (boutons "precedent/suivant") pour scroller facilement entre les periodes.

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/components/ui/date-picker/DatePickerWithInput.tsx` | Refondre : supprimer l'Input imbrique, garder Button + Popover simple |
| `src/components/ui/date-picker/YearView.tsx` | Etendre la plage d'annees avec navigation par decades |
| `src/components/ui/date-picker/DayView.tsx` | Aucun changement |
| `src/components/ui/date-picker/MonthView.tsx` | Aucun changement |

### Detail DatePickerWithInput

Structure actuelle (cassee) :
```
PopoverTrigger > Button > Input (stopPropagation → bloque l'ouverture)
```

Structure corrigee :
```
PopoverTrigger > Button (affiche date formatee ou "Choisir une date")
PopoverContent > YearView / MonthView / DayView
```

- Placeholder : `"Choisir une date"` (clair et universel)
- Affichage de la date selectionnee : `format(value, "dd MMMM yyyy", { locale: fr })`
- Plus d'Input, plus de saisie manuelle, plus de `stopPropagation`

### Detail YearView refonde

- Afficher 12 annees par page dans une grille 3x4
- Annee de depart : `currentYear` (page initiale montre les 12 dernieres annees)
- Boutons fleches `←` / `→` pour naviguer par blocs de 12 ans
- Plage totale : de 1920 a l'annee courante
- Cela permet de selectionner n'importe quelle annee en 2-3 clics maximum

### Correction des tests casses

Les fichiers de test mentionnes dans les build errors (`SimpleChildSelector.test.tsx`, `useStoryFormHandlers.test.tsx`) ont des problemes de types avec `toBeInTheDocument` et `afterEach`. Ces erreurs seront aussi corrigees (import manquant de `@testing-library/jest-dom` et de `vitest`).

