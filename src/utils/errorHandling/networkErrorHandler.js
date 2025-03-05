
/**
 * Network-specific error handling
 */

/**
 * Check if an error is network-related
 */
export function isNetworkError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  return errorMessage?.includes('net::ERR_TIMED_OUT') ||
         errorMessage?.includes('net::ERR_NAME_NOT_RESOLVED') ||
         errorMessage?.includes('Network Error') ||
         errorMessage?.includes('network request failed') ||
         error.name === 'NetworkError' ||
         error.name === 'AbortError';
}

/**
 * Handle network-related errors
 */
export function handleNetworkError(error, showToast = true) {
  console.warn('Network error:', error?.message || error);
  
  if (showToast) {
    const appEvent = new CustomEvent('app-notification', {
      detail: {
        type: 'warning',
        title: 'Problème de connexion',
        message: 'Vérifiez votre connexion internet et réessayez'
      }
    });
    document.dispatchEvent(appEvent);
  }
  
  return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
}
