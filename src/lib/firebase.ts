
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité pendant la migration vers Supabase.
 * Veuillez utiliser supabase/client à la place.
 */

import { supabase } from '@/integrations/supabase/client';

// Compatibilité Auth
export const auth = {
  currentUser: supabase.auth.getUser().then(res => res.data.user).catch(() => null),
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Configuration de l'écouteur d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    
    // Retourne une fonction pour se désabonner
    return () => {
      subscription.unsubscribe();
    };
  }
};

// Autres exports de compatibilité
export const db = {
  // Stub pour la compatibilité
  collection: () => ({
    addDoc: async () => { console.warn('Utilisation de Firebase deprecated'); return { id: 'deprecated' }; },
    doc: () => ({ id: 'deprecated' }),
    getDocs: async () => ({ docs: [] })
  })
};

export const functions = {
  // Stub pour la compatibilité
  httpsCallable: () => async () => ({ data: {} })
};

export const storage = {
  // Stub pour la compatibilité
  ref: () => ({})
};
