
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { createStoryData } from './storyFormatters';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Démarrage du processus de création d\'histoire...', {
        formData,
        currentUser: user.id
      });
      
      // Validation des données
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Enfants sélectionnés pour l\'histoire:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      // Créer l'histoire avec statut en attente
      const storyData = {
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        content: '',
        summary: 'Génération en cours...',
        preview: 'Histoire en cours de création...',
        status: 'pending',
        childrenids: formData.childrenIds,
        childrennames: childrenNames,
        objective: formData.objective,
        authorid: user.id,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      console.log('Création de l\'enregistrement initial dans la base de données...');
      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select('id')
        .single();
      
      if (error) {
        console.error("Erreur lors de l'insertion dans la base de données:", error);
        throw new Error(`Erreur lors de la création de l'enregistrement: ${error.message}`);
      }
      
      const storyId = data.id;
      console.log('Document d\'histoire initial créé avec l\'ID:', storyId);
      
      // Appeler la fonction edge pour générer l'histoire
      toast({
        title: "Création en cours",
        description: "Génération de l'histoire en cours...",
      });
      
      console.log('Appel de la fonction Edge generateStory...');
      
      try {
        const { data: generationData, error: generationError } = await supabase.functions.invoke('generateStory', {
          body: {
            storyId: storyId,
            objective: formData.objective,
            childrenNames: childrenNames
          }
        });
        
        if (generationError) {
          console.error('Erreur lors de l\'appel à la fonction de génération d\'histoire:', generationError);
          
          // Mettre à jour l'histoire avec une erreur
          await supabase
            .from('stories')
            .update({
              status: 'error',
              error: generationError.message || 'Erreur lors de la génération',
              updatedat: new Date().toISOString()
            })
            .eq('id', storyId);
          
          toast({
            title: "Erreur de génération",
            description: generationError.message || "La génération de l'histoire a échoué",
            variant: "destructive",
          });
          
          throw generationError;
        } else {
          console.log('Génération d\'histoire terminée avec succès:', generationData);
          
          // Vérifier si la génération a réussi
          if (!generationData || !generationData.success) {
            const errorMessage = generationData?.message || "Échec de la génération pour une raison inconnue";
            console.error('Échec de la génération:', errorMessage);
            
            throw new Error(errorMessage);
          }
          
          // Récupérer l'histoire complète pour la retourner
          const { data: completedStory, error: fetchError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .maybeSingle();
            
          if (fetchError) {
            console.error('Erreur lors de la récupération de l\'histoire complétée:', fetchError);
            throw new Error(`Erreur lors de la récupération de l'histoire: ${fetchError.message}`);
          }
          
          if (!completedStory) {
            console.error('Histoire non trouvée après génération');
            throw new Error("L'histoire n'a pas été trouvée après génération");
          }
          
          toast({
            title: "Histoire générée",
            description: "Votre histoire est maintenant disponible dans votre bibliothèque.",
          });
          
          return { storyId, storyData: completedStory };
        }
      } catch (invokeError: any) {
        console.error('Erreur lors de l\'appel à la fonction Edge:', invokeError);
        
        // Vérifier si l'erreur est déjà en format d'objet
        const errorMessage = typeof invokeError === 'object' && invokeError.message 
          ? invokeError.message 
          : String(invokeError);
        
        // Mettre à jour le statut de l'histoire avec l'erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: errorMessage,
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId);
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erreur durant la création d\'histoire:', error);
      
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
