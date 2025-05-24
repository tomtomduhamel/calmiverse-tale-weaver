
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Version radicalement simplifiée pour identifier le problème de génération
 */
export const useStoryCreationRadical = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const createStoryRadical = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    console.log('🚀 [RADICAL] PHASE 2 - Création d\'histoire ultra-simplifiée');
    console.log('📋 [RADICAL] FormData reçu:', JSON.stringify(formData, null, 2));
    
    if (!user) {
      console.error('❌ [RADICAL] Utilisateur non connecté');
      throw new Error("Utilisateur non connecté");
    }

    console.log('👤 [RADICAL] Utilisateur connecté:', user.id);

    // Validation minimale
    if (!formData.objective) {
      throw new Error("Objectif requis");
    }
    
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      throw new Error("Au moins un enfant requis");
    }

    const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
    const childrenNames = selectedChildren.map(child => child.name);
    
    console.log('✅ [RADICAL] Validation OK - Enfants:', childrenNames);

    try {
      // ÉTAPE 1: Création en base - ULTRA SIMPLE
      console.log('💾 [RADICAL] ÉTAPE 1 - Insertion base de données');
      
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: `Histoire Test Radical - ${childrenNames.join(' et ')}`,
          content: '',
          summary: '',
          preview: 'Test radical en cours...',
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
        console.error('❌ [RADICAL] Erreur insertion:', insertError);
        throw insertError;
      }
      
      console.log('✅ [RADICAL] Histoire créée ID:', story.id);
      
      // ÉTAPE 2: Test session RADICAL
      console.log('🔐 [RADICAL] ÉTAPE 2 - Vérification session RADICALE');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [RADICAL] Session invalide:', sessionError);
        throw new Error('Session expirée');
      }
      
      console.log('✅ [RADICAL] Session validée');
      
      // ÉTAPE 3: Appel DIRECT et SIMPLE à generateStory
      console.log('📞 [RADICAL] ÉTAPE 3 - Appel DIRECT generateStory');
      
      const payload = {
        storyId: story.id,
        objective: formData.objective,
        childrenNames: childrenNames
      };
      
      console.log('📤 [RADICAL] Payload final:', JSON.stringify(payload, null, 2));
      console.log('🎯 [RADICAL] APPEL FUNCTION INVOKE - MAINTENANT');
      
      const startTime = Date.now();
      
      // Appel ULTRA DIRECT - sans timeout, sans complexité
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generateStory', {
        body: payload
      });
      
      const endTime = Date.now();
      console.log(`⏱️ [RADICAL] Appel terminé en ${endTime - startTime}ms`);
      
      if (functionError) {
        console.error('❌ [RADICAL] ERREUR generateStory:', functionError);
        console.error('📋 [RADICAL] Détails complets:', JSON.stringify(functionError, null, 2));
        
        // Marquer comme échoué
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: `RADICAL ERROR: ${functionError.message || JSON.stringify(functionError)}`,
            updatedat: new Date().toISOString()
          })
          .eq('id', story.id);
          
        throw new Error(`FONCTION INACCESSIBLE: ${functionError.message || 'Erreur inconnue'}`);
      }
      
      console.log('✅ [RADICAL] generateStory ACCESSIBLE!');
      console.log('📋 [RADICAL] Réponse:', functionData);
      
      toast({
        title: "🎉 RADICAL - Génération lancée!",
        description: `Histoire ${story.id} en cours de génération`,
      });
      
      return story.id;
      
    } catch (error: any) {
      console.error('💥 [RADICAL] ERREUR GLOBALE:', error);
      console.error('📋 [RADICAL] Stack:', error.stack);
      
      toast({
        title: "❌ RADICAL - Échec",
        description: error.message || "Erreur système",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [user, toast]);

  return {
    createStoryRadical
  };
};
