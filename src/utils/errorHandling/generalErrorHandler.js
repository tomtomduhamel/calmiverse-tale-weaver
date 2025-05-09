
/**
 * Gestionnaire d'erreur général pour l'application
 */
import { errorManager } from './errorNotificationManager';

/**
 * Traite les erreurs et crée des messages conviviaux pour l'utilisateur
 */
export function handleGeneralError(error, showToast = true) {
  console.error('Erreur:', {
    message: error?.message || error,
    code: error?.code,
    details: error?.details
  });
  
  // Utiliser notre nouveau gestionnaire d'erreurs centralisé
  if (showToast) {
    const category = determineErrorCategory(error);
    const config = errorManager.handleError(error, category);
    return config.message;
  }
  
  // Création d'un message d'erreur convivial (pour la rétrocompatibilité)
  let userMessage = "Une erreur est survenue";
  
  // Vérification des codes d'erreur communs
  if (error?.code === 'auth/requires-recent-login') {
    userMessage = "Votre session a expiré. Veuillez vous reconnecter.";
  } else if (error?.code === 'auth/network-request-failed' || 
             error?.message?.includes('network') || 
             error?.message?.includes('connexion')) {
    userMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
  } else if (error?.code?.includes('permission-denied') || 
             error?.message?.includes('permission')) {
    userMessage = "Vous n'avez pas les permissions nécessaires pour cette action.";
  } else if (error?.message) {
    userMessage = error.message;
  }
  
  return userMessage;
}

/**
 * Détermine la catégorie d'une erreur
 */
function determineErrorCategory(error) {
  if (!error) return 'unknown';
  
  if (isAuthError(error)) return 'auth';
  if (isNetworkError(error)) return 'network';
  if (isDatabaseError(error)) return 'database';
  
  // Analyse des messages pour catégoriser
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.toLowerCase().includes('valida')) {
    return 'validation';
  }
  
  if (errorMessage.toLowerCase().includes('api') || 
      errorMessage.toLowerCase().includes('rate') ||
      errorMessage.toLowerCase().includes('limit')) {
    return 'api';
  }
  
  return 'unknown';
}

/**
 * Vérifie si une erreur est liée à l'authentification
 */
export function isAuthError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  const errorCode = error.code || '';
  
  return errorCode.includes('auth/') || 
         errorMessage.includes('authentication') || 
         errorMessage.includes('auth') ||
         errorMessage.includes('session') ||
         errorMessage.includes('login') ||
         errorMessage.includes('connexion');
}

/**
 * Vérifie si une erreur est liée à la base de données
 */
export function isDatabaseError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  const errorCode = error.code || '';
  
  return errorCode.includes('supabase') || 
         errorMessage.includes('database') ||
         errorMessage.includes('query') ||
         errorMessage.includes('db') ||
         errorMessage.includes('postgres') ||
         errorMessage.includes('sql');
}

/**
 * Vérifie si une erreur est liée au réseau
 */
export function isNetworkError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  return errorMessage?.includes('net::ERR_TIMED_OUT') ||
         errorMessage?.includes('net::ERR_NAME_NOT_RESOLVED') ||
         errorMessage?.includes('Network Error') ||
         errorMessage?.includes('network request failed') ||
         error.name === 'NetworkError' ||
         error.name === 'AbortError' ||
         errorMessage?.includes('connection') ||
         errorMessage?.includes('connexion') ||
         errorMessage?.includes('timeout') ||
         errorMessage?.includes('délai') ||
         errorMessage?.includes('réseau');
}
