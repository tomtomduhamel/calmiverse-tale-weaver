
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité pendant la migration vers Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

// Fonction de test pour vérifier la connexion Supabase
export const testFirestoreConnection = async () => {
  try {
    console.log('🔄 Starting Supabase connection test...');
    
    const { data, error } = await supabase.from('stories').select('count').limit(1).single();
    
    if (error) throw error;
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    throw error;
  }
};

// Stubs pour la compatibilité
export const addDocument = async (collectionName: string, data: any) => {
  console.warn("Fonction addDocument obsolète. Utiliser les méthodes Supabase.");
  return "deprecated";
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  console.warn("Fonction updateDocument obsolète. Utiliser les méthodes Supabase.");
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  console.warn("Fonction deleteDocument obsolète. Utiliser les méthodes Supabase.");
};

export const getDocuments = async (collectionName: string) => {
  console.warn("Fonction getDocuments obsolète. Utiliser les méthodes Supabase.");
  return [];
};

export const queryDocuments = async (
  collectionName: string, 
  field: string, 
  operator: any, 
  value: any
) => {
  console.warn("Fonction queryDocuments obsolète. Utiliser les méthodes Supabase.");
  return [];
};
