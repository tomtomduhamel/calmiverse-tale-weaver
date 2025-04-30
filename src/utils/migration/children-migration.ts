
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { transformChildForSupabase } from './transformers';

/**
 * Migre les enfants de Firebase vers Supabase
 */
export const migrateChildren = async (firebaseUid: string) => {
  try {
    // Obtenir les enfants depuis Firebase
    const childrenSnapshot = await getDocs(
      query(collection(db, "children"), where("authorId", "==", firebaseUid))
    );
    
    console.log(`${childrenSnapshot.size} enfants trouvés dans Firebase`);
    
    const { data: supabaseUser } = await supabase.auth.getUser();
    const supabaseUid = supabaseUser?.user?.id;

    if (!supabaseUid) {
      throw new Error("Aucun utilisateur Supabase connecté");
    }
    
    // Migrer chaque enfant
    const promises = childrenSnapshot.docs.map(async (doc) => {
      const childData = doc.data();
      
      // Transformer les données au format Supabase
      const supabaseChildData = transformChildForSupabase(childData, supabaseUid);
      
      // Vérifier si l'enfant existe déjà dans Supabase
      const { data: existingChildren } = await supabase
        .from('children')
        .select('*')
        .eq('name', childData.name)
        .eq('authorid', supabaseUid);
        
      if (existingChildren && existingChildren.length > 0) {
        console.log(`L'enfant ${childData.name} existe déjà dans Supabase`);
        return;
      }
      
      // Insérer l'enfant dans Supabase
      const { error } = await supabase
        .from('children')
        .insert(supabaseChildData);
        
      if (error) {
        throw error;
      }
      
      console.log(`Enfant ${childData.name} migré avec succès`);
    });
    
    await Promise.all(promises);
    console.log("Migration des enfants terminée");
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la migration des enfants:", error);
    return { success: false, error };
  }
};
