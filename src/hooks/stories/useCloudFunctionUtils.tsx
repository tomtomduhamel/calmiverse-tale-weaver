
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useCloudFunctionUtils = () => {
  // Une fonction générale qui appelle une fonction Edge avec une logique de nouvelle tentative
  const callCloudFunctionWithRetry = useCallback(async (
    functionName: string,
    payload: any,
    maxRetries: number = 2
  ) => {
    let lastError = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        console.log(`Appel de la fonction Edge "${functionName}" (tentative ${attempts + 1}/${maxRetries + 1}):`, payload);
        
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });
        
        if (error) {
          console.error(`Erreur lors de l'appel à la fonction "${functionName}":`, error);
          lastError = error;
          throw error;
        }
        
        console.log(`Réponse de la fonction "${functionName}":`, data);
        return data;
      } catch (error: any) {
        attempts++;
        lastError = error;
        
        if (attempts <= maxRetries) {
          console.log(`Nouvel essai (${attempts}/${maxRetries}) pour "${functionName}" dans 2 secondes...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error(`Toutes les tentatives ont échoué pour "${functionName}"`, error);
          break;
        }
      }
    }

    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(
      lastError?.message || 
      `La fonction "${functionName}" a échoué après ${maxRetries + 1} tentative(s)`
    );
  }, []);

  return {
    callCloudFunctionWithRetry
  };
};
