## Refonte du design system Calmiverse — apaisement mobile-first

Objectif : un design system cohérent, doux et lent, optimisé pour la lecture du soir sur téléphone. Palette **Nuit douce**, typographie **Lora + Nunito Sans**, intensité d'animation **3/5** (présence sensible mais jamais agressive).

---

### 1. Fondations (tokens) — `src/index.css` + `tailwind.config.ts`

**Palette HSL enrichie (light + dark)**
- `--background` (light) `#F5F9FC` / (dark) `#0E1626` (bleu nuit profond, plus chaud que l'actuel #0a0e1a)
- `--foreground` light `#1A2238` / dark `#E8EEF5`
- `--primary` `#457B9D` (bleu profond apaisant) + `--primary-foreground` clair
- `--primary-soft` `#A8DADC` (bleu pastel — pour halos, hovers, badges doux)
- `--accent` `#B7CFEA` (bleu brume — surfaces secondaires)
- `--muted` light `#EAF1F6` / dark `#1A2438`
- `--card` léger gradient pour profondeur tactile
- `--ring` aligné sur `--primary-soft` à 60% (focus visible mais doux)
- Nouveaux tokens sémantiques :
  - `--surface-elevated`, `--surface-sunken` (3 niveaux de profondeur)
  - `--gradient-night`, `--gradient-dawn`, `--gradient-reader` (radial doux)
  - `--shadow-soft`, `--shadow-floating`, `--shadow-glow-primary`
  - `--blur-glass` pour glassmorphism léger
  - `--radius` passe à `1rem` (12-16px) pour des formes plus rassurantes
  - `--ease-calm: cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out long)
  - `--duration-slow: 600ms`, `--duration-breath: 4s`

**Typographie**
- Import Google Fonts : `Lora` (400/500/600 italic) + `Nunito Sans` (300/400/600/700)
- Tailwind `fontFamily`: `display: ['Lora']`, `sans: ['Nunito Sans']`
- Headings → `font-display` italic léger, tracking détendu, leading `1.25`
- Body → `font-sans`, leading `1.7`, taille de base 16px (17 pour Reader)
- `font-feature-settings`: `"rlig" 1, "calt" 1, "ss01" 1`

**Reset des `text-white` / `bg-black` épars** : audit et passage en tokens sémantiques.

---

### 2. Animations douces (intensité 3/5)

Ajout dans `tailwind.config.ts` :
- `breathe` : scale 1 → 1.02 → 1, 4s, ease-in-out infinite (pour CTA principaux, indicateurs audio)
- `drift` : translateY ±6px sur 8s (éléments décoratifs, étoiles)
- `glow-pulse` : opacité halo primary, 3s
- `fade-up-slow` : 600ms `--ease-calm` (apparition des cards)
- `shimmer-soft` : skeleton loading très lent (2.5s)
- Transitions globales : `transition-colors` & `transition-opacity` à `400ms` au lieu de 150ms par défaut
- **Respect `prefers-reduced-motion`** : media query qui coupe `breathe`, `drift`, `glow-pulse`

Règle : aucune animation > 1s d'intensité forte. Pas de bounce, pas de spring agressif. Stagger doux sur listes (60-80ms).

---

### 3. Reader (priorité #1) — cœur de l'expérience

`StoryReaderLayout` + `StoryContent` + contrôles :
- Fond : gradient radial nuit (`--gradient-reader`) plutôt qu'aplat — sensation de cocon
- Largeur lecture : `max-w-[640px]`, padding latéral `px-5` mobile
- Texte : `font-display` pour titres H1/H2 (italique chaleureux), `font-sans` corps à 17px / leading 1.85
- Indentation `text-indent` sur premier `<p>` de chaque paragraphe (style livre)
- Surlignage immersif : couleurs déjà ok, mais transitions passent à `--ease-calm` 200ms (au lieu de 120ms) pour un glissement plus fluide
- Contrôles flottants : glassmorphism (`backdrop-blur-md bg-background/70`), bord `border-primary-soft/20`, ombre `--shadow-floating`
- Bouton play/pause central : taille 56px, animation `breathe` quand en lecture
- Barre de progression : trait fin 2px, couleur `--primary-soft`, glow subtil
- Mode immersif : fade des contrôles à 5s d'inactivité (déjà existant — vérifier durée)
- Halos d'ambiance : 2 blobs `blur-3xl` `--primary-soft/10` animés `drift` en arrière-plan

---

### 4. Accueil + Création histoire (priorité #2)

`Index.tsx` / `HomeView` / `CreateStory*` :
- Header : titre `font-display` italique, sous-titre `font-sans` muted
- Cards de sélection (enfant, objectif, univers) : 
  - Radius 1rem, `--shadow-soft`, hover `--shadow-floating` + scale 1.01
  - Icône Lucide dans cercle `bg-primary-soft/15` 48px
  - État sélectionné : ring 2px `--primary` + halo `glow-pulse` (lent)
- Progress bar étapes : trait fin avec dots, ease-calm
- CTA principal : `bg-primary` + animation `breathe` au repos, `--shadow-glow-primary`
- Sticky bottom nav buttons : déjà en place, polish glass + safe-area
- Suggestions/objectifs : grille 2 col mobile, animation `fade-up-slow` avec stagger

---

### 5. Bibliothèque + Cards (priorité #3)

`Library.tsx` + StoryCard :
- Layout : grille 1 col mobile (cards larges, plus tactiles) avec image-héro 16:9
- Card story : 
  - Image avec overlay gradient bas → contenu lisible
  - Titre `font-display` 18px, méta `font-sans` 13px muted
  - Badge série "📚 Tome X" → remplacer emoji par icône Lucide `BookOpen` (mémoire core: pas d'emojis dans icônes — vérifier exception)
  - Long-press → menu contextuel (déjà ?) 
  - Animation entrée : `fade-up-slow` stagger
- Filtres : chips arrondies `rounded-full`, état actif `bg-primary-soft text-primary-foreground`
- Empty state : illustration douce + texte rassurant, animation `breathe` sur l'icône
- Skeletons : `shimmer-soft`

---

### 6. Navigation mobile + Shell (priorité #4)

- Bottom nav : glassmorphism (`backdrop-blur-xl bg-background/80`), border-top `border-primary-soft/15`, hauteur 64px + safe-area
- Item actif : icône Lucide remplie + label visible + petit dot `--primary-soft` au-dessus, transition 400ms
- Item inactif : icône outline, opacity 0.6
- Header pages : sticky, blur, titre `font-display`
- Page transitions : fade + translate Y 8px sur 400ms (via `key` route + AnimatePresence si framer-motion dispo, sinon CSS)
- Toaster Sonner : reposition top-center mobile, style aligné tokens, durée 4s

---

### 7. Composants shadcn à harmoniser

Variants à enrichir (sans casser l'API) :
- `Button` : nouvelles variantes `calm` (primary-soft), `glow` (primary + breathe)
- `Card` : variante `elevated` (gradient subtil + shadow-floating)
- `Dialog` : overlay `bg-background/60 backdrop-blur-sm`, content radius 1.25rem, animation slow-up
- `Input` / `Textarea` : focus ring `--primary-soft`, transition 300ms
- `Switch` / `Slider` : couleurs primary-soft

---

### 8. Détails techniques

```text
Fichiers modifiés (estimation)
├── src/index.css                 (tokens, fonts import, keyframes)
├── tailwind.config.ts            (palette, fontFamily, animations, shadows)
├── src/App.css                   (cleanup, conserver gradients utiles)
├── src/components/ui/button.tsx  (variants calm/glow)
├── src/components/ui/card.tsx    (variant elevated)
├── src/components/story/StoryContent.tsx       (typo + transitions)
├── src/components/story/reader/StoryReaderLayout.tsx (gradient nuit)
├── src/components/story/reader/* (contrôles glass)
├── src/components/Shell + BottomNav            (glass + actif)
├── src/pages/Index.tsx + HomeView              (cards, CTA breathe)
├── src/pages/Library.tsx + StoryCard           (refonte card)
└── src/pages/CreateStory*                      (sélecteurs cards, progress)
```

Pas de changement de logique métier, pas de modif backend, pas de modif de routes. Uniquement présentation.

---

### 9. Garde-fous

- Respect `prefers-reduced-motion` partout
- Contraste AA minimum (WCAG) — vérifier `--primary` sur `--background` dans les deux modes
- Pas d'emoji dans l'UI (mémoire core) — sauf data utilisateur
- Conserver `pb-safe`, `px-3` Shell, sticky nav (mémoires existantes)
- Aucune animation > 600ms sur interaction directe (sinon perception lag)
- Tester sur viewport 360px (cible principale)

---

### 10. Livraison en 4 vagues

1. **Fondations** : tokens, fonts, keyframes, variants Button/Card → visible partout immédiatement
2. **Reader** : gradient cocon, typo, contrôles glass, surlignage adouci
3. **Accueil + Création** : cards sélection, CTA breathe, progress
4. **Bibliothèque + Shell** : refonte card story, bottom nav glass, transitions

Chaque vague est indépendante et déployable.
