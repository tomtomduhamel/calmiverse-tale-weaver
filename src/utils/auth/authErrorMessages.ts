
import { AuthError } from '@supabase/supabase-js';

/**
 * Convertit les messages d'erreur d'authentification Supabase en messages utilisateur conviviaux
 */
export const getAuthErrorMessage = (error: AuthError): string => {
  console.log("Erreur d'authentification:", error.message);
  
  switch (error.message) {
    case 'Invalid login credentials':
      return "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
    case 'User not found':
      return "Aucun compte ne correspond à cet email. Veuillez vous inscrire.";
    case 'Email already in use':
      return "Un compte existe déjà avec cet email. Veuillez vous connecter.";
    case 'Password should be at least 6 characters':
      return "Le mot de passe doit contenir au moins 6 caractères.";
    default:
      return error.message || "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
  }
};
