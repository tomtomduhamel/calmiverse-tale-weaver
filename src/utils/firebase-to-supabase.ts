
/**
 * Utilitaires pour faciliter la migration de Firebase vers Supabase
 */

import { db, auth, storage } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';

/**
 * Migre les données Firebase d'un utilisateur vers Supabase
 */
export const migrateUserData = async (userId: string) => {
  try {
    console.log(`Démarrage de la migration des données pour l'utilisateur: ${userId}`);
    
    // 1. Migrer les enfants
    await migrateChildren(userId);
    
    // 2. Migrer les histoires
    await migrateStories(userId);
    
    console.log(`Migration terminée avec succès pour l'utilisateur: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la migration des données:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

/**
 * Migre les enfants de Firebase vers Supabase
 */
const migrateChildren = async (userId: string) => {
  try {
    console.log("Migration des profils d'enfants...");
    
    // Récupérer les enfants depuis Firebase
    const childrenRef = collection(db, 'children');
    const childrenQuery = query(childrenRef, where("authorId", "==", userId));
    const childrenSnapshot = await getDocs(childrenQuery);
    
    if (childrenSnapshot.empty) {
      console.log("Aucun profil d'enfant à migrer");
      return;
    }
    
    // Migrer chaque enfant
    for (const childDoc of childrenSnapshot.docs) {
      const childData = childDoc.data();
      
      // Formater les données pour Supabase
      const supabaseChildData = {
        id: childDoc.id,
        name: childData.name,
        birthDate: childData.birthDate?.toDate?.()?.toISOString() || new Date().toISOString(),
        interests: childData.interests || [],
        gender: childData.gender || 'unknown',
        authorId: userId,
        createdAt: childData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
      
      // Insérer dans Supabase
      const { error } = await supabase
        .from('children')
        .upsert(supabaseChildData, { onConflict: 'id' });
      
      if (error) throw error;
      console.log(`Enfant migré avec succès: ${childDoc.id}`);
    }
    
    console.log(`Migration terminée pour ${childrenSnapshot.size} profils d'enfants`);
  } catch (error) {
    console.error("Erreur lors de la migration des enfants:", error);
    throw error;
  }
};

/**
 * Migre les histoires de Firebase vers Supabase
 */
const migrateStories = async (userId: string) => {
  try {
    console.log("Migration des histoires...");
    
    // Récupérer les histoires depuis Firebase
    const storiesRef = collection(db, 'stories');
    const storiesQuery = query(storiesRef, where("authorId", "==", userId));
    const storiesSnapshot = await getDocs(storiesQuery);
    
    if (storiesSnapshot.empty) {
      console.log("Aucune histoire à migrer");
      return;
    }
    
    // Migrer chaque histoire
    for (const storyDoc of storiesSnapshot.docs) {
      const storyData = storyDoc.data();
      
      // Formater les données pour Supabase
      const supabaseStoryData = {
        id: storyDoc.id,
        title: storyData.title || "Histoire sans titre",
        content: storyData.story_text || storyData.content || "",
        summary: storyData.story_summary || storyData.summary || "",
        preview: storyData.preview || "",
        status: storyData.status || "completed",
        childrenIds: storyData.childrenIds || [],
        childrenNames: storyData.childrenNames || [],
        objective: storyData.objective || "",
        authorId: userId,
        createdAt: storyData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: storyData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
      
      // Insérer dans Supabase
      const { error } = await supabase
        .from('stories')
        .upsert(supabaseStoryData, { onConflict: 'id' });
      
      if (error) throw error;
      console.log(`Histoire migrée avec succès: ${storyDoc.id}`);
    }
    
    console.log(`Migration terminée pour ${storiesSnapshot.size} histoires`);
  } catch (error) {
    console.error("Erreur lors de la migration des histoires:", error);
    throw error;
  }
};

/**
 * Utilitaire pour migrer un utilisateur Firebase vers Supabase
 */
export const migrateFirebaseUser = async () => {
  if (!auth.currentUser) {
    throw new Error("Utilisateur non connecté");
  }
  
  try {
    const { uid, email, displayName } = auth.currentUser;
    
    // Collecter les informations utilisateur depuis Firebase
    console.log(`Tentative de migration de l'utilisateur: ${email}`);
    
    // 1. Migrer l'utilisateur vers Supabase
    const { data: { user }, error } = await supabase.auth.signUp({
      email: email || '',
      password: `migrated_${Date.now()}`, // Mot de passe temporaire
      options: {
        data: {
          firstName: displayName?.split(' ')[0] || '',
          lastName: displayName?.split(' ')[1] || '',
          firebase_uid: uid
        }
      }
    });
    
    if (error) throw error;
    if (!user) throw new Error("Échec de la création de l'utilisateur dans Supabase");
    
    console.log(`Utilisateur migré avec succès vers Supabase: ${user.id}`);
    
    // 2. Migrer les données utilisateur
    await migrateUserData(uid);
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Erreur lors de la migration de l'utilisateur:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

