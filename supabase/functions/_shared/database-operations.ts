
// Remplacer l'import Node.js standard par un import compatible avec Deno
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

// Récupérer les données d'histoire depuis la base de données
export const fetchStoryDataFromDb = async (supabase: SupabaseClient, storyId: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
  
  if (error) {
    throw new Error(`Erreur lors de la récupération des données d'histoire: ${error.message}`);
  }
  
  if (!data) {
    throw new Error(`Histoire avec ID ${storyId} introuvable`);
  }
  
  return data;
};

// Vérifier si une histoire existe déjà
export const checkStoryExists = async (supabase: SupabaseClient, storyId: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('id')
    .eq('id', storyId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 est le code pour 'aucune ligne trouvée'
    throw new Error(`Erreur lors de la vérification de l'existence de l'histoire: ${error.message}`);
  }
  
  return !!data;
};

// Mettre à jour une histoire dans la base de données
export const updateStoryInDb = async (
  supabase: SupabaseClient, 
  storyId: string, 
  updates: Record<string, any>
) => {
  const { error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', storyId);
    
  if (error) {
    throw new Error(`Erreur lors de la mise à jour de l'histoire: ${error.message}`);
  }
};

// Récupérer les données d'un enfant depuis la base de données
export const fetchChildDataFromDb = async (supabase: SupabaseClient, childId: string) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();
  
  if (error) {
    throw new Error(`Erreur lors de la récupération des données de l'enfant: ${error.message}`);
  }
  
  if (!data) {
    throw new Error(`Enfant avec ID ${childId} introuvable`);
  }
  
  return data;
};
