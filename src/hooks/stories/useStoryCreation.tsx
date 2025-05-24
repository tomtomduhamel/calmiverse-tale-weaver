
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer la création des histoires avec diagnostic radical et simplification
 */
export const useStoryCreation = () => {
  const { user } = useSupabaseAuth();

  /**
   * Créer une nouvelle histoire avec approche simplifiée et diagnostic complet
   */
  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    console.log('🚀 [useStoryCreation] PHASE 1 - Début création histoire');
    console.log('📋 [useStoryCreation] FormData:', JSON.stringify(formData, null, 2));
    console.log('👤 [useStoryCreation] User:', user?.id || 'NON CONNECTÉ');
    console.log('⏰ [useStoryCreation] Timestamp:', new Date().toISOString());

    if (!user) {
      console.error('❌ [useStoryCreation] ERREUR CRITIQUE: Utilisateur non connecté');
      throw new Error("Utilisateur non connecté");
    }

    // Validation stricte
    if (!formData.objective) {
      console.error('❌ [useStoryCreation] ERREUR: Objectif manquant');
      throw new Error("L'objectif de l'histoire est obligatoire");
    }
    
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      console.error('❌ [useStoryCreation] ERREUR: Aucun enfant sélectionné');
      throw new Error("Veuillez sélectionner au moins un enfant");
    }

    const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
    const childrenNames = selectedChildren.map(child => child.name);
    
    console.log('✅ [useStoryCreation] Validation réussie');
    console.log('👥 [useStoryCreation] Enfants sélectionnés:', childrenNames);

    try {
      console.log('💾 [useStoryCreation] PHASE 2 - Insertion en base de données');
      
      // Insertion en base avec données complètes
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
        console.error('❌ [useStoryCreation] ERREUR insertion base:', insertError);
        throw insertError;
      }
      
      console.log('✅ [useStoryCreation] Histoire créée en base avec ID:', story.id);
      
      console.log('🔧 [useStoryCreation] PHASE 3 - Test de connectivité edge function');
      
      // Test simple de la session d'abord
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [useStoryCreation] ERREUR session:', sessionError);
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
      
      console.log('✅ [useStoryCreation] Session valide');
      console.log('🔑 [useStoryCreation] Token présent:', !!session.access_token);
      
      // Préparation du payload simplifié
      const payload = {
        storyId: story.id,
        objective: formData.objective,
        childrenNames: childrenNames
      };
      
      console.log('📦 [useStoryCreation] Payload edge function:', JSON.stringify(payload, null, 2));
      console.log('📞 [useStoryCreation] PHASE 4 - Appel edge function generateStory');
      console.log('⏰ [useStoryCreation] Heure appel:', new Date().toISOString());
      
      // Appel direct simplifié à la fonction edge
      console.log('🔥 [useStoryCreation] APPEL DIRECT - generateStory');
      const startTime = Date.now();
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generateStory', {
        body: payload
      });
      
      const endTime = Date.now();
      console.log(`⏱️ [useStoryCreation] Appel terminé en ${endTime - startTime}ms`);
      
      if (functionError) {
        console.error('❌ [useStoryCreation] ERREUR edge function:', functionError);
        console.error('📋 [useStoryCreation] Détails erreur:', JSON.stringify(functionError, null, 2));
        
        // Marquer l'histoire comme échouée
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: `Erreur generateStory: ${functionError.message || 'Erreur inconnue'}`,
            updatedat: new Date().toISOString()
          })
          .eq('id', story.id);
          
        throw new Error(`Échec génération: ${functionError.message || 'Erreur inconnue'}`);
      }
      
      console.log('✅ [useStoryCreation] Edge function appelée avec succès');
      console.log('📋 [useStoryCreation] Réponse function:', functionData);
      console.log('🎉 [useStoryCreation] SUCCÈS COMPLET - Histoire ID:', story.id);
      
      return story.id;
      
    } catch (error: any) {
      console.error('💥 [useStoryCreation] ERREUR GLOBALE:', error);
      console.error('📋 [useStoryCreation] Message:', error.message);
      console.error('📋 [useStoryCreation] Stack:', error.stack);
      throw error;
    }
  }, [user]);

  return {
    createStory
  };
};
