
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCloudFunctionUtils = () => {
  const callCloudFunctionWithRetry = useCallback(async (functionName: string, payload: any, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`Appel de la fonction cloud ${functionName} (tentative ${retries + 1}/${maxRetries})`, payload);
        
        const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
        
        if (error) throw error;
        
        console.log(`Fonction ${functionName} exécutée avec succès:`, data);
        return data;
      } catch (error) {
        console.error(`Erreur lors de l'appel à ${functionName}:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`Nombre maximum de tentatives atteint pour ${functionName}`);
          throw error;
        }
        
        // Attendre un peu avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  }, []);

  return { callCloudFunctionWithRetry };
};
