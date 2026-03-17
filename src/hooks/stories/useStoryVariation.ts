import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AgeCognition {
  id: string;
  range: string;
  characteristics: string;
  preferred_supports: string[];
  is_active: boolean;
}

interface NarrativeSchema {
  id: string;
  type: string;
  description: string;
  mechanism: string;
  is_active: boolean;
}

interface VakogFocus {
  id: string;
  sensory_type: string;
  sensory_keywords: string[];
  is_active: boolean;
}

interface SymbolicUniverse {
  id: string;
  name: string;
  description: string;
  visual_style: string | null;
  objective_affinity: string[];
  is_active: boolean;
}

interface EricksonianTechnique {
  id: string;
  name: string;
  linguistic_pattern: string;
  objective_affinity: string[];
  is_active: boolean;
}

export interface StoryVariation {
  ageCognition: AgeCognition | null;
  narrativeSchema: NarrativeSchema | null;
  vakogFocus: VakogFocus | null;
  symbolicUniverse: SymbolicUniverse | null;
  ericksonianTechnique: EricksonianTechnique | null;
}

const pickRandom = <T>(arr: T[]): T | null => {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Détermine la tranche d'âge correspondante
 */
const findAgeCognition = (age: number, entries: AgeCognition[]): AgeCognition | null => {
  if (age <= 2) return entries.find(e => e.range === '0-2 ans') || null;
  if (age <= 4) return entries.find(e => e.range === '2-4 ans') || null;
  if (age <= 6) return entries.find(e => e.range === '4-6 ans') || null;
  if (age <= 12) return entries.find(e => e.range === '8-12 ans') || null;
  return entries.find(e => e.range === '13+ ans') || null;
};

/**
 * Hook pour récupérer les ingrédients narratifs depuis la DB.
 * Appeler selectVariation() pour obtenir une sélection aléatoire.
 */
export const useStoryVariation = () => {
  const { data: ingredients, isLoading } = useQuery({
    queryKey: ["story-ingredients"],
    queryFn: async () => {
      const [ageRes, narrativeRes, vakogRes, symbolicRes, ericksonianRes] = await Promise.all([
        supabase.from("age_cognition").select("*").eq("is_active", true),
        supabase.from("narrative_schemas").select("*").eq("is_active", true),
        supabase.from("vakog_focus").select("*").eq("is_active", true),
        supabase.from("symbolic_universes").select("*").eq("is_active", true),
        supabase.from("ericksonian_techniques").select("*").eq("is_active", true),
      ]);

      return {
        ageCognitions: (ageRes.data || []) as AgeCognition[],
        narrativeSchemas: (narrativeRes.data || []) as NarrativeSchema[],
        vakogFocuses: (vakogRes.data || []) as VakogFocus[],
        symbolicUniverses: (symbolicRes.data || []) as SymbolicUniverse[],
        ericksonianTechniques: (ericksonianRes.data || []) as EricksonianTechnique[],
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  /**
   * Sélectionne aléatoirement un élément de chaque catégorie.
   * Filtre par objectif pour symbolic_universes et ericksonian_techniques.
   */
  const selectVariation = (youngestAge: number, objective?: string): StoryVariation => {
    if (!ingredients) {
      return { ageCognition: null, narrativeSchema: null, vakogFocus: null, symbolicUniverse: null, ericksonianTechnique: null };
    }

    const ageCognition = findAgeCognition(youngestAge, ingredients.ageCognitions);
    const narrativeSchema = pickRandom(ingredients.narrativeSchemas);
    const vakogFocus = pickRandom(ingredients.vakogFocuses);

    // Filtrer par objectif si disponible, sinon prendre tout
    let filteredUniverses = ingredients.symbolicUniverses;
    if (objective) {
      const matched = filteredUniverses.filter(u => u.objective_affinity.includes(objective));
      if (matched.length > 0) filteredUniverses = matched;
    }
    const symbolicUniverse = pickRandom(filteredUniverses);

    let filteredTechniques = ingredients.ericksonianTechniques;
    if (objective) {
      const matched = filteredTechniques.filter(t => t.objective_affinity.includes(objective));
      if (matched.length > 0) filteredTechniques = matched;
    }
    const ericksonianTechnique = pickRandom(filteredTechniques);

    return { ageCognition, narrativeSchema, vakogFocus, symbolicUniverse, ericksonianTechnique };
  };

  return { selectVariation, isLoading, ingredients };
};
