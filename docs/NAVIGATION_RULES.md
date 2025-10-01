# 📋 RÈGLES DE NAVIGATION CALMIVERSE - PHASE 6

## 🎯 Objectif
Ce document définit les règles strictes de navigation pour éviter les régressions et garantir une expérience utilisateur fluide en SPA (Single Page Application).

## ⚠️ RÈGLES CRITIQUES (À NE JAMAIS VIOLER)

### 1️⃣ UN SEUL SYSTÈME DE NAVIGATION
**✅ TOUJOURS utiliser:**
- `useAppNavigation` hook pour toutes les navigations programmatiques
- React Router `<Link>` pour les liens dans le JSX
- `useNavigate` UNIQUEMENT via `useAppNavigation`

**❌ JAMAIS utiliser:**
- `window.location.href` (force un rechargement complet)
- `window.location.reload()` (sauf cas exceptionnel après nettoyage SW)
- Balises `<a>` HTML natives (sauf liens externes)
- Navigation mixte (plusieurs systèmes en même temps)
- `useViewManagement` (SUPPRIMÉ - ne plus jamais recréer)

### 2️⃣ REACT ROUTER COMME SOURCE DE VÉRITÉ
**État de navigation:**
- L'URL (`location.pathname`) est la seule source de vérité
- Pas d'état local `currentView` dupliquant l'URL
- Utiliser `useLocation()` pour lire l'état actuel

**Exemple correct:**
```tsx
const location = useLocation();
const isActive = location.pathname === '/library';
```

**Exemple INCORRECT:**
```tsx
const [currentView, setCurrentView] = useState('library'); // ❌ Duplique l'URL
```

### 3️⃣ SERVICE WORKER ET PWA
**Nettoyage Service Worker:**
- Utiliser le flag `localStorage` pour éviter les boucles infinies
- Ne nettoyer qu'UNE SEULE FOIS au premier chargement
- Flag: `calmi-sw-cleaned-v2`

**Code de référence dans `main.tsx`:**
```tsx
const SW_CLEANUP_FLAG = 'calmi-sw-cleaned-v2';
const hasBeenCleaned = localStorage.getItem(SW_CLEANUP_FLAG);
if (hasBeenCleaned === 'true') return;
```

### 4️⃣ COMPOSANTS LOURDS HORS DU CHEMIN CRITIQUE
**StoryGenerationManager:**
- ❌ Ne JAMAIS le monter dans `<Shell>` au niveau racine
- ✅ Le monter uniquement dans les pages qui en ont besoin
- Raison: Éviter de bloquer le rendu initial

### 5️⃣ TIMEOUT D'AUTHENTIFICATION
**Délai maximal:** 5 secondes (pas 10s)
- Évite les blocages prolongés
- Feedback utilisateur rapide si problème réseau

## 🛠️ HOOKS ET COMPOSANTS

### Hook Central: `useAppNavigation`
```tsx
const {
  navigateToHome,
  navigateToLibrary,
  navigateToCreate,
  navigateToProfiles,
  navigateToSettings,
  navigateToStory,
  handleStoryCreated,
  handleStoryDeleted
} = useAppNavigation();
```

### Composants de Navigation
- `<Navigation>` (desktop)
- `<MobileMenu>` (mobile)
- Les deux utilisent `useAppNavigation` exclusivement

## 🚫 ANTI-PATTERNS À ÉVITER

### ❌ Dupliquer l'État de Navigation
```tsx
// INCORRECT
const [currentView, setCurrentView] = useState('home');
const location = useLocation();
// On a maintenant 2 sources de vérité!
```

### ❌ Mélanger les Systèmes de Navigation
```tsx
// INCORRECT
onClick={() => {
  window.location.href = '/library'; // ❌ Rechargement complet
  navigate('/library'); // ❌ Conflit
}}
```

### ❌ Forcer des Rechargements
```tsx
// INCORRECT - sauf cas très spécifique (SW cleanup)
window.location.reload();
```

## ✅ PATTERNS CORRECTS

### Navigation Programmatique
```tsx
const { navigateToLibrary } = useAppNavigation();

const handleSuccess = () => {
  navigateToLibrary({
    title: "Succès",
    description: "Opération terminée"
  });
};
```

### Navigation Déclarative
```tsx
import { Link } from 'react-router-dom';

<Link to="/library">Bibliothèque</Link>
```

### Vérifier la Route Active
```tsx
const location = useLocation();
const isLibraryActive = location.pathname === '/library';
```

## 🔍 DEBUGGING

### Logs de Navigation
Tous les hooks de navigation loggent leurs actions:
```
[AppNavigation] Navigation vers l'histoire: abc-123
[MobileMenu] Navigation vers /library
```

### Vérifier les Problèmes
1. **Console Browser:** Chercher "Navigation" dans les logs
2. **Network Tab:** Aucune requête HTML complète lors de la navigation interne
3. **React DevTools:** Vérifier que les composants ne se démontent pas complètement

## 📊 MÉTHODOLOGIE DE REFACTORING

### Avant de Modifier le Code de Navigation:
1. ✅ Lister TOUS les fichiers qui utilisent la navigation
2. ✅ Identifier les duplications et conflits
3. ✅ Créer un plan détaillé
4. ✅ Tester chaque changement individuellement
5. ✅ NE PAS introduire de nouveaux systèmes de navigation

### Après Modification:
1. ✅ Tester TOUS les chemins de navigation
2. ✅ Vérifier qu'aucun rechargement complet n'arrive
3. ✅ Confirmer que les logs sont cohérents
4. ✅ Tester en mode navigation privée (sans cache)

## 🎓 LEÇONS APPRISES

### Pourquoi ces Bugs Apparaissaient:
1. **Hybridation:** Mélange de `useViewManagement` + `useAppNavigation` + `window.location`
2. **Duplication d'état:** `currentView` + `location.pathname`
3. **Service Worker obsolète:** Cachait les nouvelles routes
4. **Composants lourds bloquants:** `StoryGenerationManager` dans le chemin critique
5. **Timeout trop long:** 10s = mauvaise UX

### Solution Adoptée:
- ✅ UN SEUL système: `useAppNavigation` + React Router
- ✅ UNE SEULE source de vérité: `location.pathname`
- ✅ Nettoyage SW intelligent avec flag
- ✅ Architecture simplifiée

## 📚 RÉFÉRENCES

### Fichiers Clés:
- `/src/hooks/navigation/useAppNavigation.ts` - Hook central
- `/src/components/MobileMenu.tsx` - Navigation mobile
- `/src/components/navigation/Navigation.tsx` - Navigation desktop
- `/src/main.tsx` - Service Worker cleanup
- `/src/components/Shell.tsx` - Layout principal

### Documentation:
- React Router: https://reactrouter.com/
- PWA Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

**Date de création:** 2025-10-01  
**Dernière mise à jour:** 2025-10-01  
**Version:** 2.0 (Post-refactoring complet)
