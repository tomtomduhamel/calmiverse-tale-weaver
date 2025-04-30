
import { auth } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { migrateUserData } from './user-data-migration';

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
      const migrationResult = await migrateUserData(firebaseUser.uid);
      return { 
        success: true, 
        message: `L'utilisateur existe déjà dans Supabase, ${migrationResult.success ? 'données migrées' : 'échec de la migration des données'}` 
      };
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
    const migrationResult = await migrateUserData(firebaseUser.uid);
    
    return { 
      success: true, 
      message: `Utilisateur créé dans Supabase, ${migrationResult.success ? 'données migrées avec succès' : 'échec de la migration des données'}` 
    };
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return { success: false, error: error.message };
  }
};

// Ré-exporter pour maintenir la compatibilité
export { migrateUserData } from './user-data-migration';
