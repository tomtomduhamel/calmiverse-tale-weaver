
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePostgreSQLFallback } from './usePostgreSQLFallback';
import type { Child } from '@/types/child';

export const useStoryCreation = () => {
  const { user } = useSupabaseAuth();
  const { generateStoryWithFallback, checkFallbackMode } = usePostgreSQLFallback();

  const createStory = useCallback(async (
    formData: { childrenIds: string[], objective: string },
    children: Child[] = []
  ) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    console.log('[useStoryCreation] Création histoire:', { formData, user: user.id });

    try {
      // Récupérer les noms des enfants
      const childrenNames = formData.childrenIds.map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || `Enfant-${id.slice(0, 8)}`;
      });

      console.log('[useStoryCreation] Noms enfants:', childrenNames);

      // Vérifier si le mode fallback est activé
      const isFallbackMode = checkFallbackMode();
      console.log('[useStoryCreation] Mode fallback actif:', isFallbackMode);

      if (isFallbackMode) {
        // Utiliser le fallback PostgreSQL
        console.log('[useStoryCreation] Utilisation du fallback PostgreSQL');
        const storyId = await generateStoryWithFallback({
          objective: formData.objective,
          childrenNames
        });
        return { storyId };
      }

      // Créer l'histoire en base avec statut pending
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: `Histoire en cours pour ${childrenNames.join(' et ')}`,
          content: '',
          summary: 'Génération en cours...',
          preview: 'Histoire en cours de création...',
          status: 'pending',
          objective: formData.objective,
          childrennames: childrenNames,
          authorid: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('[useStoryCreation] Erreur insertion:', insertError);
        throw insertError;
      }

      console.log('[useStoryCreation] Histoire créée en base:', story.id);

      // Tenter d'appeler la Edge Function
      try {
        console.log('[useStoryCreation] Appel Edge Function generateStory...');
        
        const { error: functionError } = await supabase.functions.invoke('generateStory', {
          body: {
            storyId: story.id,
            objective: formData.objective,
            childrenNames
          }
        });

        if (functionError) {
          console.error('[useStoryCreation] Erreur Edge Function:', functionError);
          
          // En cas d'erreur Edge Function, activer automatiquement le fallback
          console.log('[useStoryCreation] Activation automatique du fallback');
          
          await generateStoryWithFallback({
            objective: formData.objective,
            childrenNames,
            storyId: story.id
          });
        } else {
          console.log('[useStoryCreation] Edge Function appelée avec succès');
        }
      } catch (edgeFunctionError) {
        console.error('[useStoryCreation] Exception Edge Function:', edgeFunctionError);
        
        // En cas d'exception, utiliser le fallback
        console.log('[useStoryCreation] Fallback automatique après exception');
        
        await generateStoryWithFallback({
          objective: formData.objective,
          childrenNames,
          storyId: story.id
        });
      }

      return { storyId: story.id };

    } catch (error: any) {
      console.error('[useStoryCreation] Erreur globale:', error);
      throw error;
    }
  }, [user, generateStoryWithFallback, checkFallbackMode]);

  return { createStory };
};

export default useStoryCreation;
