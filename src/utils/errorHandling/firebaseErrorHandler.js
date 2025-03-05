
/**
 * Firebase-specific error handling
 */

/**
 * Process Firebase errors and creates user-friendly messages
 */
export function handleFirebaseError(error, showToast = true) {
  console.error('Firebase Error:', {
    message: error?.message || error,
    code: error?.code,
    details: error?.details
  });
  
  // Create a user-friendly error message
  let userMessage = "Une erreur est survenue avec Firebase";
  
  // Check for common error codes
  if (error?.code === 'auth/requires-recent-login') {
    userMessage = "Votre session a expiré. Veuillez vous reconnecter.";
  } else if (error?.code === 'auth/network-request-failed') {
    userMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
  } else if (error?.code?.includes('permission-denied')) {
    userMessage = "Vous n'avez pas les permissions nécessaires pour cette action.";
  } else if (error?.message) {
    userMessage = error.message;
  }
  
  if (showToast) {
    // Dispatch a custom event for the notification system
    const appEvent = new CustomEvent('app-notification', {
      detail: {
        type: 'error',
        title: 'Erreur Firebase',
        message: userMessage
      }
    });
    document.dispatchEvent(appEvent);
  }
  
  return userMessage;
}

/**
 * Check if an error is Firebase-related
 */
export function isFirebaseError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  const errorStack = error.stack || '';
  
  return error.code?.includes('auth/') || 
         error.code?.includes('firestore/') ||
         errorMessage?.includes('firebase') ||
         errorMessage?.includes('firestore') ||
         errorMessage?.includes('INTERNAL') ||
         errorMessage?.includes('Failed to get document') ||
         errorMessage?.includes('FirebaseError') ||
         errorStack?.includes('firebase');
}
