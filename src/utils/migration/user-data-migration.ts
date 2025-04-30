
import { migrateChildren } from './children-migration';
import { migrateStories } from './stories-migration';

/**
 * Migre les données d'un utilisateur de Firebase vers Supabase
 */
export const migrateUserData = async (firebaseUid: string) => {
  try {
    console.log("Migration des données de l'utilisateur:", firebaseUid);
    
    // 1. Migrer les enfants
    const childrenResult = await migrateChildren(firebaseUid);
    if (!childrenResult.success) {
      console.error("Erreur lors de la migration des enfants");
    }
    
    // 2. Migrer les histoires
    const storiesResult = await migrateStories(firebaseUid);
    if (!storiesResult.success) {
      console.error("Erreur lors de la migration des histoires");
    }
    
    // Vérifier si la migration a réussi
    const success = childrenResult.success || storiesResult.success;
    
    return { 
      success, 
      message: success ? "Données migrées avec succès" : "Échec de la migration des données"
    };
  } catch (error: any) {
    console.error("Erreur lors de la migration des données:", error);
    return { success: false, message: error.message };
  }
};
