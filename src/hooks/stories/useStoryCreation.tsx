
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Starting story creation process...', {
        formData,
        currentUser: user.id
      });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Selected children for story:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      // Créer les données initiales de l'histoire
      const storyData = {
        title: `Histoire pour ${childrenNames.join(', ')}`,
        content: "Génération en cours...",
        summary: "Résumé en cours de génération...",
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenids: formData.childrenIds,
        childrennames: childrenNames,
        status: "pending",
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        authorid: user.id
      };

      console.log('Creating initial story document with pending status');
      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();
      
      if (error) {
        console.error("Erreur lors de la création de l'histoire:", error);
        throw error;
      }
      
      const storyId = data.id;
      console.log('Initial story document created with ID:', storyId);
      
      console.log('Triggering story generation Supabase Edge Function');
      
      // Afficher un toast initial avant d'appeler la fonction
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      // Appeler la fonction Edge Supabase de manière asynchrone
      supabase.functions.invoke('generate-story', {
        body: {
          storyId: storyId,
          objective: formData.objective,
          childrenNames: childrenNames
        }
      })
        .then((result) => {
          console.log('Story generation completed for story ID:', storyId, result.data);
          
          if (!result.error) {
            toast({
              title: "Histoire générée",
              description: "Votre histoire est maintenant disponible dans votre bibliothèque.",
            });
          } else {
            console.error('Error in story generation:', result.error);
            toast({
              title: "Erreur",
              description: "La génération de l'histoire a échoué: " + result.error.message,
              variant: "destructive",
            });

            // Mettre à jour le statut de l'histoire à "error"
            supabase
              .from('stories')
              .update({
                status: 'error',
                error: result.error.message,
                updatedat: new Date().toISOString()
              })
              .eq('id', storyId);
          }
        })
        .catch(error => {
          console.error('Failed to generate story:', error);
          
          // Mettre à jour le statut de l'histoire à "error"
          supabase
            .from('stories')
            .update({
              status: 'error',
              error: error instanceof Error ? error.message : 'Story generation failed',
              updatedat: new Date().toISOString()
            })
            .eq('id', storyId)
            .then(() => {
              toast({
                title: "Erreur de génération",
                description: error instanceof Error ? error.message : "La génération de l'histoire a échoué",
                variant: "destructive",
              });
            });
        });
      
      return storyId;
    } catch (error) {
      console.error('❌ Error during story creation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createStory
  };
};
