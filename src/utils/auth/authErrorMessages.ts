
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
    case 'User already registered':
      return "Un compte existe déjà avec cet email. Cliquez sur 'Connexion' pour vous connecter.";
    case 'Password should be at least 6 characters':
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case 'Email rate limit exceeded':
    case 'over_email_send_rate_limit':
      return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.";
    case 'Signup requires a valid password':
      return "Veuillez entrer un mot de passe valide (minimum 6 caractères).";
    default:
      // Afficher le message Supabase brut pour faciliter le débogage
      return error.message || "Une erreur est survenue. Veuillez réessayer.";
  }
};

