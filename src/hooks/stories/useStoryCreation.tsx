
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      console.error("Error: Trying to create a story without authentication");
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('[useStoryCreation] Création avec données:', formData, 'pour utilisateur:', user.id);
      
      // Validation explicite côté client pour éviter les appels réseau inutiles
      if (!Array.isArray(formData.childrenIds) || formData.childrenIds.length === 0) {
        console.error("[useStoryCreation] Erreur de validation: childrenIds invalide", formData.childrenIds);
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      if (!formData.objective) {
        console.error("[useStoryCreation] Erreur de validation: objectif manquant");
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      // Récupérer les données complètes des enfants sélectionnés
      const selectedChildren = children.filter(child => 
        Array.isArray(formData.childrenIds) && formData.childrenIds.includes(child.id)
      );
      
      // Vérifier qu'on a bien trouvé les enfants
      if (selectedChildren.length === 0) {
        console.error("[useStoryCreation] Aucun enfant trouvé malgré des IDs fournis:", 
          { providedIds: formData.childrenIds, availableChildren: children.map(c => c.id) });
        throw new Error("Impossible de trouver les enfants sélectionnés");
      }
      
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('[useStoryCreation] Enfants sélectionnés:', childrenNames, 'IDs:', formData.childrenIds);
      
      // Insérer l'histoire avec le statut "en attente"
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: `Histoire en cours de création pour ${childrenNames.join(' et ')}`,
          content: '',
          summary: '',
          preview: '',
          status: 'pending',
          childrenids: formData.childrenIds,
          childrennames: childrenNames,
          objective: formData.objective,
          authorid: user.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("[useStoryCreation] Erreur d'insertion:", insertError);
        throw insertError;
      }
      
      console.log("[useStoryCreation] Histoire créée avec succès, appel de la fonction edge:", story);
      
      // Appeler la fonction edge pour générer l'histoire
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generateStory',
        {
          body: {
            storyId: story.id,
            objective: formData.objective,
            childrenNames: childrenNames
          },
        }
      );
      
      if (functionError) {
        // Mettre à jour l'histoire avec le statut d'erreur
        console.error("[useStoryCreation] Erreur lors de l'appel à la fonction de génération:", functionError);
        
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: functionError.message || "Erreur lors de l'appel à la fonction de génération",
            updatedat: new Date().toISOString()
          })
          .eq('id', story.id);
          
        throw functionError;
      }
      
      console.log("[useStoryCreation] Génération démarrée avec succès:", functionData);
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      return story.id;
    } catch (error: any) {
      console.error('[useStoryCreation] Erreur pendant la création:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return {
    createStory
  };
};
