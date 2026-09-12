# Standards Médias, Hooks React & Mocks Vitest - Calmiverse (v1.0)

Ce document formalise les règles architecturales et techniques acquises lors de l'implémentation de la génération vidéo Veo 3.1 et de la stabilisation de l'infrastructure de tests.

---

## 1. Pipeline de Génération Vidéo Magique (Google Veo 3.1 Lite & n8n)

### Règle d'or de l'aiguillage bi-mode dans n8n :
Tout workflow n8n gérant la création de médias pour une histoire doit impérativement **séparer la création complète d'histoire de la génération à posteriori d'un média unique** via un nœud `Router_action` :
- **Condition** : `{{ $json.body.action === 'generate_video_only' }}`
- **Branche Standalone (`True`)** :
  1. Télécharger l'image de couverture existante depuis le bucket `storyimages/` (`Download_existing_image`).
  2. Analyser l'image pour formuler le prompt d'animation (`Analyze_image_standalone` via Gemini).
  3. Générer la vidéo (`video_story_standalone` via Google Veo 3.1 `models/veo-3.1-lite-generate-preview`).
  4. Sauvegarder le fichier binaire `.mp4` dans `storyvideos/{storyId}.mp4` (`Post_standalone_video_supabase`).
  5. Mettre à jour atomiquement `stories.video_path` via PATCH Supabase (`Maj_standalone_story_video`).
  - **Interdiction formelle** d'exécuter les nœuds de prompt narrative ou d'écraser les champs de texte de l'histoire.
- **Branche Initiale (`False`)** : Exécute le flux complet de création d'histoire (texte + illustrations + audio/vidéo).

### Sécurisation de l'Edge Function `generate-story-video` :
- **Validation préalable de `image_path`** : Renvoyer une erreur 400 claire si l'histoire ne dispose pas d'illustration (Veo nécessite obligatoirement une image source).
- **Vérification de sécurité** : Exiger le header `N8N_WEBHOOK_SECRET`.
- **Propagation des erreurs** : Si n8n renvoie une erreur (status != 200), renvoyer une erreur explicite au client pour ne pas afficher un faux succès.

---

## 2. Expérience Utilisateur & Synchronisation Réactive (Frontend)

### Gestion d'état asynchrone long (~20-30s) :
- Ne jamais réinitialiser l'état `isGeneratingVideo(storyId)` à la simple réponse de l'Edge Function. L'Edge Function ne fait que lancer le webhook n8n en arrière-plan.
- Définir un timeout de garde (3 minutes) dans le hook (`useStoryVideoGeneration.ts`) pour éviter tout blocage UI en cas de panne réseau sévère.

### Double écoute Réactive (WebSockets + Polling) :
- Écouter les mises à jour de la table `stories` via **Supabase Realtime** (`story_video_update_${storyId}`).
- Doubler l'écoute d'un **polling de repli toutes les 5 secondes** pendant toute la durée où `isGeneratingVideo === true`, garantissant la réactivité même si le WebSocket est coupé ou en veille mobile.
- Dès que `video_path` est renseigné :
  - Arrêter le spinner.
  - Afficher une notification Toast de succès.
  - Mettre à jour l'état local de l'histoire (`currentStory`).
  - Transformer automatiquement le bouton `+ Vidéo` en bouton de lecture `Vidéo` (Play) sans rechargement de page.

---

## 3. Règle d'Or des Hooks React : Dépendances Primitives

- **Proscription des objets complexes instables dans `useEffect`** :
  - Ne jamais insérer un objet retourné par un hook ou un contexte utilisateur (ex: `user` issu de `useSupabaseAuth()`) dans le tableau de dépendances de `useEffect`.
  - Si le contexte recrée un objet à chaque passe, le hook déclenche une boucle infinie de re-renders :
    `useEffect` -> `setState` -> re-render -> nouvelle ref d'objet -> `useEffect` -> ...
  - **Règle** : Toujours utiliser l'identifiant primitif (`user?.id`, `story?.id`, `child?.id`).

---

## 4. Standards de Mocking Vitest & Environnement JSDOM

### Interdiction des Proxies Récursifs sans Borne :
- Ne jamais implémenter de mock avec un `Proxy` qui renvoie `vi.fn(() => chain)` pour toutes les propriétés indistinctement.
- **Raison** : Lorsqu'une assertion échoue dans un test, le système de formatage / pretty-printer de Vitest inspecte l'arborescence des objets (`toJSON`, `inspect`, `Symbol.iterator`, `Symbol.toStringTag`). Un Proxy renvoyant un nouvel objet mock pour chaque clé déclenche une récursion infinie, aboutissant à :
  `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory (4 GB)`.

### Bonnes Pratiques de Mock Supabase pour les Tests de Pages :
- Définir explicitement les méthodes nécessaires avec chaînage direct :
  ```ts
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  }));
  ```
- Isoler les composants lourds contenant des moteurs Web Audio / synthèses vocales (`StoryReader`) lorsqu'on teste uniquement le routage ou le chargement de la page conteneur (`StoryReaderPage.test.tsx`).
