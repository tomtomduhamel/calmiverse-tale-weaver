

## Plan: Intégrer le prompt de génération vidéo dans le flux n8n

### Constat

Le prompt `video_generation_prompt` est configuré dans l'admin (`PromptAdmin.tsx`) mais n'est jamais lu ni envoyé à n8n dans `useN8nStoryFromTitle.tsx`. Le payload envoie `generateVideo: true/false` mais sans le prompt associé -- n8n ne reçoit donc aucune instruction pour générer la vidéo.

### Changements

**1. `src/hooks/stories/useN8nStoryFromTitle.tsx`** (2 modifications)

- Ajouter la récupération du prompt vidéo depuis la DB (comme c'est fait pour `imageGenerationPrompt`) :
  ```typescript
  const videoGenerationPrompt = prompts?.video_generation_prompt;
  if (!videoGenerationPrompt) {
    console.warn('[N8nStoryFromTitle] ⚠️ Prompt de génération vidéo non trouvé');
  }
  ```

- Ajouter `videoGenerationPrompt` dans le payload envoyé à n8n, à côté de `imageGenerationPrompt` :
  ```typescript
  videoGenerationPrompt: videoGenerationPrompt || null,
  ```

**2. `src/hooks/prompts/useActivePrompts.ts`**

- Ajouter `video_generation_prompt` explicitement dans l'interface `ActivePrompts` pour la documentation du type.

### Impact

Seul le payload n8n change (un champ ajouté). Côté n8n, le workflow pourra utiliser `videoGenerationPrompt` quand `generateVideo` est `true`.

