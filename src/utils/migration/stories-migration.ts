
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { transformStoryForSupabase } from './transformers';

/**
 * Migre les histoires de Firebase vers Supabase
 */
export const migrateStories = async (firebaseUid: string) => {
  try {
    // Obtenir les histoires depuis Firebase
    const storiesSnapshot = await getDocs(
      query(collection(db, "stories"), where("authorId", "==", firebaseUid))
    );
    
    console.log(`${storiesSnapshot.size} histoires trouvées dans Firebase`);
    
    const { data: supabaseUser } = await supabase.auth.getUser();
    const supabaseUid = supabaseUser?.user?.id;

    if (!supabaseUid) {
      throw new Error("Aucun utilisateur Supabase connecté");
    }
    
    // Migrer chaque histoire
    const promises = storiesSnapshot.docs.map(async (doc) => {
      const storyData = doc.data();
      
      // Transformer les données au format Supabase
      const supabaseStoryData = transformStoryForSupabase(storyData, supabaseUid);
      
      // Vérifier si l'histoire existe déjà dans Supabase par titre
      const { data: existingStories } = await supabase
        .from('stories')
        .select('*')
        .eq('title', supabaseStoryData.title)
        .eq('authorid', supabaseUid);
        
      if (existingStories && existingStories.length > 0) {
        console.log(`L'histoire "${supabaseStoryData.title}" existe déjà dans Supabase`);
        return;
      }
      
      // Insérer l'histoire dans Supabase
      const { error } = await supabase
        .from('stories')
        .insert(supabaseStoryData);
        
      if (error) {
        throw error;
      }
      
      console.log(`Histoire "${supabaseStoryData.title}" migrée avec succès`);
    });
    
    await Promise.all(promises);
    console.log("Migration des histoires terminée");
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la migration des histoires:", error);
    return { success: false, error };
  }
};
