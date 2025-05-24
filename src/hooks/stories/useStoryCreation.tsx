
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer la création des histoires avec diagnostic approfondi
 */
export const useStoryCreation = () => {
  const { user } = useSupabaseAuth();

  /**
   * Créer une nouvelle histoire avec diagnostic détaillé
   */
  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    console.log('🚀 [useStoryCreation] Début de la création d\'histoire');
    console.log('📋 [useStoryCreation] FormData reçu:', JSON.stringify(formData, null, 2));
    console.log('👥 [useStoryCreation] Children disponibles:', children?.length || 0);
    console.log('👤 [useStoryCreation] Utilisateur connecté:', user?.id || 'NON CONNECTÉ');

    if (!user) {
      console.error('❌ [useStoryCreation] ERREUR: Utilisateur non connecté');
      throw new Error("Utilisateur non connecté");
    }

    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('✅ [useStoryCreation] Enfants sélectionnés:', childrenNames);
      
      if (!formData.objective) {
        console.error('❌ [useStoryCreation] ERREUR: Objectif manquant');
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        console.error('❌ [useStoryCreation] ERREUR: Aucun enfant sélectionné');
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      console.log('📝 [useStoryCreation] Insertion de l\'histoire en base...');
      
      // Insérer l'histoire avec le statut "en attente"
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: `Histoire pour ${childrenNames.join(' et ')} - En création...`,
          content: '',
          summary: '',
          preview: 'Génération en cours...',
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
        console.error('❌ [useStoryCreation] ERREUR lors de l\'insertion:', insertError);
        throw insertError;
      }
      
      console.log('✅ [useStoryCreation] Histoire créée avec ID:', story.id);
      console.log('📞 [useStoryCreation] Appel de la fonction generateStory...');
      
      // Préparer les données pour la fonction edge
      const functionPayload = {
        storyId: story.id,
        objective: formData.objective,
        childrenNames: childrenNames
      };
      
      console.log('📦 [useStoryCreation] Payload pour generateStory:', JSON.stringify(functionPayload, null, 2));
      
      // Vérifier la session avant l'appel
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [useStoryCreation] ERREUR de session:', sessionError);
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
      
      console.log('🔑 [useStoryCreation] Session valide, token présent:', !!session.access_token);
      
      // Appeler la fonction edge avec timeout et logging détaillé
      console.log('⏱️ [useStoryCreation] Début de l\'appel à generateStory à', new Date().toISOString());
      
      const startTime = Date.now();
      const { data: functionData, error: functionError } = await Promise.race([
        supabase.functions.invoke('generateStory', {
          body: functionPayload,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de 60 secondes dépassé')), 60000)
        )
      ]) as any;
      
      const endTime = Date.now();
      console.log(`⏱️ [useStoryCreation] Appel terminé en ${endTime - startTime}ms`);
      
      if (functionError) {
        console.error('❌ [useStoryCreation] ERREUR de la fonction edge:', functionError);
        console.error('📋 [useStoryCreation] Détails de l\'erreur:', JSON.stringify(functionError, null, 2));
        
        // Mettre à jour l'histoire avec le statut d'erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: `Erreur generateStory: ${functionError.message || 'Erreur inconnue'}`,
            updatedat: new Date().toISOString()
          })
          .eq('id', story.id);
          
        throw new Error(`Échec de la génération: ${functionError.message || 'Erreur inconnue'}`);
      }
      
      console.log('✅ [useStoryCreation] Fonction appelée avec succès:', functionData);
      console.log('🎉 [useStoryCreation] Histoire créée et génération lancée pour ID:', story.id);
      
      return story.id;
    } catch (error: any) {
      console.error('💥 [useStoryCreation] ERREUR GLOBALE:', error);
      console.error('📋 [useStoryCreation] Stack trace:', error.stack);
      throw error;
    }
  }, [user]);

  return {
    createStory
  };
};
