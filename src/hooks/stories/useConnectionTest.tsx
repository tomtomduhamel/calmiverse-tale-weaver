
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    console.log('🧪 [ConnectionTest] DÉBUT du test de connexion');
    
    try {
      // Test 1: Vérifier la session
      console.log('🔐 [ConnectionTest] Test 1 - Vérification session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error(`Session invalide: ${sessionError?.message || 'Pas de session'}`);
      }
      
      console.log('✅ [ConnectionTest] Session OK, token présent:', !!session.access_token);

      // Test 2: Appel simple à testConnection
      console.log('📡 [ConnectionTest] Test 2 - Appel fonction edge testConnection');
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test de connexion radical'
      };
      
      console.log('📤 [ConnectionTest] Payload envoyé:', testPayload);
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('testConnection', {
        body: testPayload
      });
      const endTime = Date.now();
      
      console.log(`⏱️ [ConnectionTest] Appel terminé en ${endTime - startTime}ms`);
      
      if (error) {
        console.error('❌ [ConnectionTest] Erreur fonction edge:', error);
        throw error;
      }
      
      console.log('✅ [ConnectionTest] Réponse reçue:', data);
      setLastTestResult({ success: true, data, duration: endTime - startTime });
      
      toast({
        title: "Test de connexion réussi",
        description: `Réponse reçue en ${endTime - startTime}ms`,
      });
      
      return { success: true, data };
      
    } catch (error: any) {
      console.error('💥 [ConnectionTest] ERREUR GLOBALE:', error);
      setLastTestResult({ success: false, error: error.message });
      
      toast({
        title: "Test de connexion échoué",
        description: error.message || "Erreur inconnue",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsTesting(false);
    }
  }, [toast]);

  const testGenerateStoryDirect = useCallback(async () => {
    setIsTesting(true);
    console.log('🎯 [ConnectionTest] TEST DIRECT generateStory - AVEC NOM CORRIGÉ');
    
    try {
      const payload = {
        test: true,
        storyId: 'test-direct-' + Date.now(),
        objective: 'Test direct de la fonction generateStory',
        childrenNames: ['TestChild']
      };
      
      console.log('📤 [ConnectionTest] Appel DIRECT generateStory (nom corrigé) avec:', payload);
      
      const startTime = Date.now();
      // CORRECTION CRITIQUE: S'assurer qu'on utilise bien 'generateStory' et non 'generate-story'
      const { data, error } = await supabase.functions.invoke('generateStory', {
        body: payload
      });
      const endTime = Date.now();
      
      console.log(`⏱️ [ConnectionTest] generateStory répondu en ${endTime - startTime}ms`);
      
      if (error) {
        console.error('❌ [ConnectionTest] Erreur generateStory:', error);
        throw error;
      }
      
      console.log('✅ [ConnectionTest] generateStory réponse:', data);
      setLastTestResult({ success: true, data, duration: endTime - startTime });
      
      toast({
        title: "✅ Test generateStory réussi",
        description: `Fonction accessible en ${endTime - startTime}ms avec le nom corrigé`,
      });
      
      return { success: true, data };
      
    } catch (error: any) {
      console.error('💥 [ConnectionTest] Erreur test generateStory:', error);
      setLastTestResult({ success: false, error: error.message });
      
      toast({
        title: "Test generateStory échoué",
        description: error.message || "La fonction generateStory n'est pas accessible",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsTesting(false);
    }
  }, [toast]);

  return {
    testConnection,
    testGenerateStoryDirect,
    isTesting,
    lastTestResult
  };
};
