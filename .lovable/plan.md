

## Analyse du probleme

Les screenshots iPhone montrent deux problemes lies au safe area iOS :

1. **SharedStoryAcceptDialog** : Le dialog de mapping de personnages (image 1) montre les boutons "Refuser" et "Accepter l'histoire" partiellement caches par le home indicator de l'iPhone. Le dialog utilise `max-h-[90vh]` et `overflow-y-auto` mais le footer n'est pas protege par le safe area.

2. **MobileMenu** : Le menu bottom utilise `pb-safe` qui depend de `env(safe-area-inset-bottom)`. Cette valeur CSS ne fonctionne que si la page est rendue en mode `viewport-fit=cover` ET que le contenu atteint le bord de l'ecran. Le `viewport-fit=cover` est present dans le HTML, mais le padding safe area peut ne pas s'appliquer correctement dans tous les contextes (dialogs, PWA standalone).

## Plan de correction

### 1. Corriger le MobileMenu (`src/components/MobileMenu.tsx`)

Remplacer la classe CSS custom `pb-safe` par un padding inline plus robuste et ajouter un fallback :

```css
/* Dans index.css - ameliorer pb-safe */
.pb-safe {
  padding-bottom: max(8px, env(safe-area-inset-bottom, 8px));
}
```

### 2. Corriger le SharedStoryAcceptDialog (`src/components/story/share/SharedStoryAcceptDialog.tsx`)

Le `DialogContent` a besoin d'un padding bottom pour le safe area iOS. Modifier la classe du `DialogContent` et du `DialogFooter` :

- `DialogContent` : ajouter `pb-safe` pour que le contenu entier respecte le safe area
- `DialogFooter` : ajouter un padding bottom supplementaire pour garantir que les boutons soient toujours visibles et cliquables

### 3. Ameliorer le Shell (`src/components/Shell.tsx`)

S'assurer que le padding bottom du contenu principal tient compte du safe area sur iOS quand le menu mobile est affiche :

- Changer `pb-16` en `pb-[calc(4rem+env(safe-area-inset-bottom,0px))]` pour le contenu principal quand le menu mobile est present

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/index.css` | Ameliorer `.pb-safe` avec `max()` et fallback |
| `src/components/MobileMenu.tsx` | Padding safe area plus robuste |
| `src/components/story/share/SharedStoryAcceptDialog.tsx` | Ajouter safe area au DialogContent/Footer |
| `src/components/Shell.tsx` | Padding bottom adaptatif avec safe area |

