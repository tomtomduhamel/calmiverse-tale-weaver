
import { auth, db } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

/**
 * Migre un utilisateur de Firebase vers Supabase
 */
export const migrateFirebaseUser = async () => {
  try {
    // Vérifier si l'utilisateur est connecté à Firebase
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return { success: false, error: "Aucun utilisateur Firebase connecté" };
    }

    console.log("Migration de l'utilisateur Firebase:", firebaseUser.email);

    // Vérifier si l'utilisateur est déjà dans Supabase
    const { data: existingUser, error: checkError } = await supabase.auth.getUser();
    
    if (existingUser?.user) {
      console.log("L'utilisateur existe déjà dans Supabase", existingUser.user);
      
      // Si l'utilisateur existe déjà, migrer ses données
      await migrateUserData(firebaseUser.uid);
      return { success: true, message: "L'utilisateur existe déjà dans Supabase, données migrées" };
    }

    // Créer l'utilisateur dans Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: firebaseUser.email,
      password: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`, // Mot de passe aléatoire
    });

    if (signUpError) {
      console.error("Erreur lors de la création du compte Supabase:", signUpError);
      return { success: false, error: signUpError.message };
    }

    console.log("Utilisateur créé dans Supabase:", signUpData.user);

    // Migrer les données de l'utilisateur
    await migrateUserData(firebaseUser.uid);

    return { success: true, message: "Utilisateur et données migrés avec succès" };
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Migre les données d'un utilisateur de Firebase vers Supabase
 */
export const migrateUserData = async (firebaseUid: string) => {
  try {
    console.log("Migration des données de l'utilisateur:", firebaseUid);
    
    // 1. Migrer les enfants
    await migrateChildren(firebaseUid);
    
    // 2. Migrer les histoires
    await migrateStories(firebaseUid);
    
    return { success: true, message: "Données migrées avec succès" };
  } catch (error) {
    console.error("Erreur lors de la migration des données:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Migre les enfants de Firebase vers Supabase
 */
const migrateChildren = async (firebaseUid: string) => {
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
      
      // Convertir les données au format Supabase
      const supabaseChildData = {
        name: childData.name,
        birthDate: childData.birthDate ? new Date(childData.birthDate.toDate()).toISOString() : new Date().toISOString(),
        authorId: supabaseUid,
        interests: childData.interests || [],
        gender: childData.gender || 'unknown',
        createdAt: new Date().toISOString()
      };
      
      // Vérifier si l'enfant existe déjà dans Supabase
      const { data: existingChildren } = await supabase
        .from('children')
        .select('*')
        .eq('name', childData.name)
        .eq('authorId', supabaseUid);
        
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

/**
 * Migre les histoires de Firebase vers Supabase
 */
const migrateStories = async (firebaseUid: string) => {
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
      
      // Convertir les données au format Supabase
      const supabaseStoryData = {
        title: storyData.title || "Histoire sans titre",
        content: storyData.story_text || storyData.content || "",
        summary: storyData.story_summary || storyData.summary || "",
        preview: storyData.preview || "",
        status: storyData.status || "completed",
        childrenIds: storyData.childrenIds || [],
        childrenNames: storyData.childrenNames || [],
        objective: storyData.objective ? (typeof storyData.objective === 'object' ? storyData.objective.value : storyData.objective) : "",
        authorId: supabaseUid,
        createdAt: storyData.createdAt ? new Date(storyData.createdAt.toDate()).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Vérifier si l'histoire existe déjà dans Supabase par titre
      const { data: existingStories } = await supabase
        .from('stories')
        .select('*')
        .eq('title', supabaseStoryData.title)
        .eq('authorId', supabaseUid);
        
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
