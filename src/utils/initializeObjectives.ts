
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 * Les objectifs sont désormais stockés dans Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

const objectives = [
  {
    name: "Aider à s'endormir",
    value: "sleep",
    label: "Aider à s'endormir"
  },
  {
    name: "Se concentrer",
    value: "focus",
    label: "Se concentrer"
  },
  {
    name: "Se détendre",
    value: "relax",
    label: "Se détendre"
  },
  {
    name: "S'amuser",
    value: "fun",
    label: "S'amuser"
  }
];

export const initializeObjectives = async () => {
  try {
    // Vérifier si les objectifs existent déjà dans Supabase
    const { data, error } = await supabase
      .from('story_objectives')
      .select('count')
      .single();
      
    if (error) throw error;
    
    // Initialiser seulement si la table est vide
    if (!data || data.count === 0) {
      const { error: insertError } = await supabase
        .from('story_objectives')
        .insert(objectives);
        
      if (insertError) throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error("Échec de l'initialisation des objectifs:", error);
    return false;
  }
};
