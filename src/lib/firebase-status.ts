
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité pendant la migration vers Supabase.
 */

// Stub de fonction pour la compatibilité
export const checkFirebaseStatus = async () => {
  console.warn("Fonction checkFirebaseStatus obsolète. Utiliser les vérifications Supabase.");
  return {
    firestore: false,
    auth: false,
    functions: false,
    storage: false,
    error: "Firebase n'est plus utilisé"
  };
};

// Stub de fonction pour la compatibilité
export const logFirebaseStatus = async () => {
  console.warn("Fonction logFirebaseStatus obsolète. Utiliser les vérifications Supabase.");
  return await checkFirebaseStatus();
};
