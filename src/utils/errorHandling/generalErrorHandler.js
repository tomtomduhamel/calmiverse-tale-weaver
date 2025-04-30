
/**
 * Gestionnaire d'erreur général pour remplacer le gestionnaire Firebase
 */

/**
 * Traite les erreurs et crée des messages conviviaux pour l'utilisateur
 */
export function handleGeneralError(error, showToast = true) {
  console.error('Erreur:', {
    message: error?.message || error,
    code: error?.code,
    details: error?.details
  });
  
  // Création d'un message d'erreur convivial
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
  
  if (showToast) {
    // Déclenchement d'un événement personnalisé pour le système de notification
    const appEvent = new CustomEvent('app-notification', {
      detail: {
        type: 'error',
        title: 'Erreur',
        message: userMessage
      }
    });
    document.dispatchEvent(appEvent);
  }
  
  return userMessage;
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
         errorMessage.includes('session');
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
         errorMessage.includes('Failed to get document');
}
