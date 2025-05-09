
/**
 * Network-specific error handling
 */
import { errorManager } from './errorNotificationManager';

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
         error.name === 'AbortError' ||
         errorMessage?.includes('connection') ||
         errorMessage?.includes('connexion') ||
         errorMessage?.includes('timeout') ||
         errorMessage?.includes('délai') ||
         errorMessage?.includes('réseau');
}

/**
 * Handle network-related errors
 */
export function handleNetworkError(error, showToast = true) {
  console.warn('Network error:', error?.message || error);
  
  if (showToast) {
    errorManager.handleError(error, 'network');
  }
  
  return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
}

/**
 * Ajouter un timeout configurable pour les requêtes fetch
 */
export function fetchWithTimeout(url, options = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('La requête a expiré - délai dépassé'));
    }, timeout);
    
    fetch(url, { ...options, signal })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}
