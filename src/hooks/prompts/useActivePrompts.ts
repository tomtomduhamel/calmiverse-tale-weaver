import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivePrompts {
  advanced_story_prompt_template?: string;
  sequel_prompt_template?: string;
  story_system_prompt?: string;
  [key: string]: string | undefined;
}

interface PromptTemplateRow {
  key: string;
  active_content: string | null;
}

/**
 * Hook pour récupérer les prompts actifs depuis la base de données
 * Utilise la vue v_active_prompt_templates pour obtenir les versions actives
 */
export const useActivePrompts = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["active-prompts"],
    queryFn: async (): Promise<ActivePrompts> => {
      console.log("[useActivePrompts] Récupération des prompts actifs...");

      const { data: templates, error: fetchError } = await supabase
        .from("v_active_prompt_templates")
        .select("key, active_content");

      if (fetchError) {
        console.error("[useActivePrompts] Erreur de récupération:", fetchError);
        // Ne pas throw, retourner un objet vide pour permettre le fallback
        return {};
      }

      // Construire l'objet des prompts par clé
      const prompts: ActivePrompts = {};
      
      if (templates) {
        (templates as PromptTemplateRow[]).forEach((template) => {
          if (template.key && template.active_content) {
            prompts[template.key] = template.active_content;
          }
        });
      }

      console.log("[useActivePrompts] Prompts récupérés:", Object.keys(prompts));
      return prompts;
    },
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garder en cache pendant 10 minutes
    retry: 2, // Retry 2 fois en cas d'échec
    retryDelay: 1000, // Attendre 1 seconde entre les retries
  });

  return {
    prompts: data || {},
    isLoading,
    error,
    refetch,
  };
};

/**
 * Fonction utilitaire pour récupérer un prompt spécifique
 * À utiliser en dehors de React (ex: Edge Functions)
 */
export const fetchActivePrompt = async (
  key: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("v_active_prompt_templates")
    .select("active_content")
    .eq("key", key)
    .single();

  if (error) {
    console.error(`[fetchActivePrompt] Erreur pour ${key}:`, error);
    return null;
  }

  return data?.active_content || null;
};
