# Bug : surlignage qui « rattrape » après une pause

## Diagnostic

Le problème vient de `src/hooks/story/reader/useReadingProgress.ts`.

Le hook calcule l'index du mot courant à partir d'un temps écoulé :
```
elapsed = now - startTimeRef - pausedTimeRef
wordIndex = floor(elapsed / msPerWord)
```

Pour que ça reste juste après une pause, il faut **ajouter à `pausedTimeRef` la durée réelle de la pause** au moment où on reprend. Or aujourd'hui :

1. Quand `isPaused` passe à `true`, l'effet s'exécute une fois, ajoute `(now - lastUpdate)` à `pausedTimeRef`, met `lastUpdate = now`, puis `return`. Pendant toute la pause, **plus rien ne tourne** (pas de `requestAnimationFrame`), donc `lastUpdate` reste figé sur l'instant du début de pause.
2. Quand on reprend (`isPaused` repasse à `false`), l'effet relance directement `animate()` **sans compenser la durée de pause**. `startTimeRef` est toujours l'ancien, `pausedTimeRef` n'a pas bougé.
3. Résultat : `elapsed = now - startTime - pausedTime` inclut toute la durée de pause → l'index saute brutalement de plusieurs dizaines/centaines de mots, ce qui surligne d'un coup une grande portion du texte.

Même cause pour la pause auto (`isPaused` venant du défilement) et la pause manuelle (`isManuallyPaused`).

Note : le hook de défilement (`useAutoScroll`) ne souffre pas du bug car il recalcule un nouveau `startTime` et `startPosition` à chaque `startAutoScroll()`. Le surlignage doit faire l'équivalent.

## Correctif proposé

Dans `useReadingProgress.ts`, mémoriser l'instant exact d'entrée en pause et ajouter la durée écoulée à `pausedTimeRef` au moment de la reprise.

Concrètement :

- Ajouter `pauseStartRef = useRef<number | null>(null)`.
- Dans l'effet, distinguer 3 transitions :
  - **Entrée en pause** (`isPaused || isManuallyPaused` devient vrai pendant `isAutoScrolling`) : `pauseStartRef.current = performance.now()`, annuler la frame en cours, ne rien faire d'autre.
  - **Reprise** (`isAutoScrolling` vrai et plus en pause, avec `pauseStartRef.current` défini) : `pausedTimeRef.current += performance.now() - pauseStartRef.current`, `pauseStartRef.current = null`, puis lancer `requestAnimationFrame(animate)`.
  - **Premier démarrage** (`startTimeRef.current === null`) : comportement actuel.
- Supprimer la logique fragile basée sur `lastUpdateRef` qui n'est plus nécessaire.
- Conserver le reset complet quand on revient à l'état idle (déjà géré dans le 1er `useEffect`).

Vérifier aussi que `startTimeRef` n'est **pas** réinitialisé lors d'une simple reprise (sinon on repart du mot 0). Seul `pausedTimeRef` doit être ajusté.

## Validation

1. Lancer la lecture, laisser surligner ~30s.
2. Pause via le bouton, attendre 20s.
3. Reprendre : le mot surligné doit reprendre **exactement** où il s'était arrêté, sans saut.
4. Refaire le test avec plusieurs pauses successives.
5. Vérifier que le défilement (`useAutoScroll`) reste synchronisé avec le surlignage (les deux utilisent la même `readingSpeed` du `ReadingSpeedContext`).

## Fichier modifié

- `src/hooks/story/reader/useReadingProgress.ts` (logique de pause/reprise uniquement, ~15 lignes)

Aucun changement business/UI nécessaire.