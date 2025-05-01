
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCloudFunctionUtils = () => {
  const callCloudFunctionWithRetry = useCallback(async (
    functionName: string, 
    payload: any, 
    maxRetries = 3
  ) => {
    let retries = 0;
    let lastError = null;
    
    while (retries < maxRetries) {
      try {
        console.log(`Calling edge function ${functionName} (attempt ${retries + 1})`, payload);
        
        const { data, error } = await supabase.functions.invoke(
          functionName,
          { body: payload }
        );
        
        if (error) {
          console.error(`Error in ${functionName} (attempt ${retries + 1}):`, error);
          lastError = error;
          retries++;
          
          // Wait before retrying (exponential backoff)
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.log(`${functionName} succeeded on attempt ${retries + 1}:`, data);
        return data;
      } catch (error) {
        console.error(`Exception in ${functionName} (attempt ${retries + 1}):`, error);
        lastError = error;
        retries++;
        
        if (retries >= maxRetries) break;
        
        // Wait before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
      }
    }
    
    // If we got here, all retries failed
    console.error(`All ${maxRetries} attempts to call ${functionName} failed`);
    throw lastError || new Error(`Failed to call ${functionName} after ${maxRetries} attempts`);
  }, []);

  return {
    callCloudFunctionWithRetry
  };
};
