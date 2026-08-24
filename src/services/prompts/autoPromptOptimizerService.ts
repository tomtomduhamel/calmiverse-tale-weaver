import { supabase } from "@/integrations/supabase/client";

// URL du webhook n8n hébergé pour l'auto-optimisation des prompts
export const N8N_AUTO_OPTIMIZE_PROMPT_WEBHOOK = 
  "https://n8n.srv856374.hstgr.cloud/webhook/auto-optimize-prompts";

export interface AutoOptimizeOptions {
  objective?: 'sleep' | 'focus' | 'relax' | 'fun' | 'all';
  batchSize?: number;
}

export interface OptimizationResult {
  template_key: string;
  objective: string;
  title: string;
  version: number;
  new_version_id: string;
  changelog: string;
  stats?: {
    total_stories: number;
    rated_count: number;
    avg_user_rating: string;
    avg_critique_score: string;
  };
}

export interface AutoOptimizeResponse {
  success: boolean;
  message: string;
  results?: OptimizationResult[];
  error?: string;
}

export const autoPromptOptimizerService = {
  /**
   * Déclenche l'auto-optimisation continue via le webhook n8n (gpt-5.6-terra)
   */
  async triggerOptimization(options: AutoOptimizeOptions = {}): Promise<AutoOptimizeResponse> {
    const payload = {
      objective: options.objective || "all",
      batchSize: options.batchSize || 20,
    };

    console.log("[autoPromptOptimizerService] Déclenchement de l'optimisation continue:", payload);

    try {
      const response = await fetch(N8N_AUTO_OPTIMIZE_PROMPT_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur n8n (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data as AutoOptimizeResponse;
    } catch (error: any) {
      console.error("[autoPromptOptimizerService] Erreur lors de l'appel n8n:", error);
      throw error;
    }
  },

  /**
   * Récupère le résumé du dernier lot d'histoires avec notes et critiques
   */
  async fetchBatchStats(objective: string = "sleep", limit: number = 20) {
    let query = supabase
      .from("v_story_learning_batch" as any)
      .select("*")
      .limit(limit);

    if (objective !== "all") {
      query = query.eq("objective", objective);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[autoPromptOptimizerService] Erreur fetchBatchStats:", error);
      return { total: 0, ratedCount: 0, avgRating: 0, avgCritique: 0, items: [] };
    }

    const items = data || [];
    const rated = items.filter((i: any) => i.user_rating != null);
    const ratings = rated.map((i: any) => Number(i.user_rating));
    const critiques = items.filter((i: any) => i.critique_score != null).map((i: any) => Number(i.critique_score));

    const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
    const avgCritique = critiques.length > 0 ? critiques.reduce((a: number, b: number) => a + b, 0) / critiques.length : 0;

    return {
      total: items.length,
      ratedCount: rated.length,
      avgRating: Math.round(avgRating * 10) / 10,
      avgCritique: Math.round(avgCritique * 10) / 10,
      items
    };
  }
};
