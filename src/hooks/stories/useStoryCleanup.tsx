
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour nettoyer les histoires zombie et bloquées
 */
export const useStoryCleanup = () => {
  const { toast } = useToast();

  /**
   * Nettoyer les histoires en statut pending depuis plus de 10 minutes
   */
  const cleanupZombieStories = useCallback(async () => {
    try {
      console.log('🧹 [StoryCleanup] Début nettoyage histoires zombie');
      
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      // Trouver les histoires zombie
      const { data: zombieStories, error: fetchError } = await supabase
        .from('stories')
        .select('id, title, createdat')
        .eq('status', 'pending')
        .lt('createdat', tenMinutesAgo);
        
      if (fetchError) {
        console.error('❌ [StoryCleanup] Erreur récupération zombies:', fetchError);
        throw fetchError;
      }
      
      if (!zombieStories || zombieStories.length === 0) {
        console.log('✅ [StoryCleanup] Aucune histoire zombie trouvée');
        return { cleaned: 0 };
      }
      
      console.log(`🧟 [StoryCleanup] ${zombieStories.length} histoires zombie trouvées`);
      
      // Marquer comme échouées
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'error',
          error: 'Génération interrompue - histoire zombie nettoyée',
          updatedat: new Date().toISOString()
        })
        .in('id', zombieStories.map(s => s.id));
        
      if (updateError) {
        console.error('❌ [StoryCleanup] Erreur mise à jour zombies:', updateError);
        throw updateError;
      }
      
      console.log(`✅ [StoryCleanup] ${zombieStories.length} histoires zombie nettoyées`);
      
      toast({
        title: "Nettoyage terminé",
        description: `${zombieStories.length} histoires bloquées ont été nettoyées`,
      });
      
      return { cleaned: zombieStories.length };
      
    } catch (error: any) {
      console.error('💥 [StoryCleanup] Erreur globale:', error);
      toast({
        title: "Erreur de nettoyage",
        description: error.message || "Impossible de nettoyer les histoires bloquées",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  /**
   * Forcer la récupération d'une histoire spécifique
   */
  const forceRecoverStory = useCallback(async (storyId: string) => {
    try {
      console.log(`🔄 [StoryCleanup] Récupération forcée histoire: ${storyId}`);
      
      // Remettre en pending avec nouveau timestamp
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'pending',
          updatedat: new Date().toISOString(),
          error: null
        })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Relancer la génération
      const { error: retryError } = await supabase.functions.invoke('generateStory', {
        body: { storyId }
      });

      if (retryError) {
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: `Relance échouée: ${retryError.message}`,
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId);
        
        throw retryError;
      }

      console.log(`✅ [StoryCleanup] Histoire ${storyId} relancée avec succès`);
      
      toast({
        title: "Relance réussie",
        description: "L'histoire a été relancée avec succès",
      });

      return true;
    } catch (error: any) {
      console.error(`💥 [StoryCleanup] Erreur récupération ${storyId}:`, error);
      toast({
        title: "Erreur de relance",
        description: error.message || "Impossible de relancer l'histoire",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    cleanupZombieStories,
    forceRecoverStory
  };
};
