

## Diagnostic

L'erreur **"The string did not match the expected pattern"** affichée dans la capture d'écran provient du **webhook n8n** qui génère les titres d'histoires. Ce n'est PAS un problème côté application React — c'est le serveur n8n qui renvoie cette erreur, et l'app l'affiche telle quelle.

### Origine de l'erreur

1. L'app envoie une requête POST au webhook n8n (`https://n8n.srv856374.hstgr.cloud/webhook/...`)
2. n8n appelle un LLM (probablement GPT) avec un **Structured Output Parser** qui attend un JSON strict (`title_1`, `title_2`, `title_3`, etc.)
3. Le LLM renvoie parfois une réponse qui ne correspond pas au schéma attendu → n8n renvoie l'erreur brute **"The string did not match the expected pattern"**
4. L'app catch cette erreur et l'affiche directement dans `generationError`, sans la reformuler

### Pourquoi c'est un problème dans l'app

Le code dans `TitleBasedStoryCreator.tsx` (ligne 156) stocke `error.message` tel quel dans `generationError`, puis l'affiche brut à l'utilisateur (ligne 341). Le message technique n8n arrive donc directement à l'écran.

De plus, le système de retry dans `retryUtils.ts` ne retente **que** sur les erreurs réseau/timeout (`retryCondition` ligne 369-373). Une erreur HTTP 200 avec un message d'erreur dans le body, ou une erreur 500 de n8n, n'est pas toujours retentée.

---

## Plan de correction

### 1. Améliorer le message d'erreur affiché à l'utilisateur

**Fichier : `src/components/story/title/TitleBasedStoryCreator.tsx`**

Dans le rendu de l'erreur (lignes 338-341), remplacer l'affichage brut par un message utilisateur-friendly :

```tsx
{generationError === "Failed to fetch" 
  ? "Un problème de connexion est survenu..."
  : "Une erreur temporaire est survenue lors de la génération. Réessayez dans quelques instants."}
```

Ne plus afficher le message technique brut. Le conserver uniquement dans `console.error`.

### 2. Ajouter un retry automatique sur erreur serveur n8n

**Fichier : `src/hooks/stories/useN8nTitleGeneration.tsx`**

Modifier la `retryCondition` (lignes 369-373) pour inclure aussi les erreurs de type "pattern" ou erreurs 500 :

```tsx
retryCondition: (error) => {
  const msg = error?.message?.toLowerCase() || '';
  return msg.includes('timeout') || 
         msg.includes('network') || 
         msg.includes('connexion') ||
         msg.includes('pattern') ||     // erreur n8n structured output
         msg.includes('500');            // erreur serveur
}
```

### 3. Vérifier le contenu de la réponse n8n avant de parser

**Fichier : `src/hooks/stories/useN8nTitleGeneration.tsx`**

Après `response.json()` (ligne 382), ajouter une vérification :

```tsx
const result = await response.json();

// Détecter si n8n a renvoyé une erreur dans le body
if (result?.error || result?.message?.includes('pattern')) {
  throw new Error('Le serveur de génération a rencontré une erreur temporaire');
}
```

### 4. Ajouter un retry automatique côté UI

**Fichier : `src/components/story/title/TitleBasedStoryCreator.tsx`**

Dans le `.catch()` de l'auto-génération (ligne 154), ajouter un compteur de tentatives automatiques (max 2) avant d'afficher l'erreur à l'utilisateur. Utiliser un `useRef` pour tracker les tentatives :

```tsx
const autoRetryCount = useRef(0);
const MAX_AUTO_RETRIES = 2;

// Dans le catch :
if (autoRetryCount.current < MAX_AUTO_RETRIES) {
  autoRetryCount.current++;
  autoGenerateTriggered.current = false; // Permet de relancer
  // Le useEffect relancera automatiquement
} else {
  setGenerationError("user-friendly message");
  autoRetryCount.current = 0;
}
```

---

## Résumé en termes simples

L'erreur vient du serveur n8n qui génère les titres : parfois l'IA ne produit pas le format JSON attendu, et n8n renvoie un message d'erreur technique. Ton app affiche ce message brut à l'utilisateur au lieu d'un message clair.

Le plan corrige 3 choses :
1. **Message clair** : l'utilisateur voit "Erreur temporaire, réessayez" au lieu du charabia technique
2. **Retry automatique** : si n8n échoue, l'app réessaie 2 fois automatiquement avant d'afficher l'erreur
3. **Détection d'erreur n8n** : vérification du contenu de la réponse pour attraper les erreurs "cachées" dans des réponses HTTP 200

