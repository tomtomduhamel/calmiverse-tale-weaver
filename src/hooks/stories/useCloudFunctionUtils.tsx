
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const useCloudFunctionUtils = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const callCloudFunctionWithRetry = async (
    functionName: string, 
    body: any, 
    options = { maxRetries: 2, retryDelay: 1500 }
  ) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    let retries = 0;
    setIsRetrying(true);

    try {
      while (retries <= options.maxRetries) {
        try {
          console.log(`Appel de la fonction cloud ${functionName} (tentative ${retries + 1})`, body);
          
          const { data, error } = await supabase.functions.invoke(functionName, { body });
          
          if (error) throw error;
          
          console.log(`Fonction ${functionName} exécutée avec succès:`, data);
          setIsRetrying(false);
          return data;
        } catch (err: any) {
          console.error(`Erreur lors de l'appel à ${functionName} (tentative ${retries + 1}):`, err);
          
          if (retries >= options.maxRetries) {
            throw err;
          }
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, options.retryDelay));
          retries++;
        }
      }
    } catch (error: any) {
      setIsRetrying(false);
      toast({
        title: "Erreur",
        description: `Échec de l'appel à ${functionName}: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    callCloudFunctionWithRetry,
    isRetrying
  };
};
