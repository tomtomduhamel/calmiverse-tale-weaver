
/**
 * Global error event handlers for the application
 */
import { isFirebaseError, handleFirebaseError } from './firebaseErrorHandler';
import { isNetworkError, handleNetworkError } from './networkErrorHandler';

/**
 * Sets up global error handling for uncaught exceptions
 */
export function setupGlobalErrorHandler() {
  console.log("Setting up global error handler");
  
  // Global error handler
  window.addEventListener('error', function(event) {
    // Completely ignore all postMessage, clone and DataCloneError related errors
    if (event.message?.includes('postMessage') || 
        event.message?.includes('clone') ||
        event.message?.includes('DataCloneError') ||
        event.message?.includes('serialize') ||
        event.filename?.includes('gptengineer.js')) {
      console.warn('Suppressed non-critical error:', event.message);
      event.preventDefault();
      return false;
    }
    
    // Ignore network-related errors for Firebase services
    if (event.target?.tagName === 'LINK' || 
        event.target?.tagName === 'SCRIPT' ||
        isNetworkError(event)) {
      handleNetworkError(event);
      event.preventDefault();
      return false;
    }
    
    // Handle Firebase errors more gracefully
    if (isFirebaseError(event.error || event)) {
      handleFirebaseError(event.error || event);
      
      // Prevent the default error handling
      event.preventDefault();
      return false;
    }
    
    // Create serializable error object for other errors
    const errorInfo = {
      message: event.error?.message || event.message,
      type: 'Global Error',
      timestamp: new Date().toISOString()
    };
    
    console.error('Application Error:', errorInfo);
    return false;
  }, true);
}

/**
 * Sets up handling for unhandled promise rejections
 */
export function setupPromiseErrorHandler() {
  console.log("Setting up promise error handler");
  
  // Unhandled promise handler
  window.addEventListener('unhandledrejection', function(event) {
    // Completely ignore all postMessage and clone related errors
    if (event.reason?.message?.includes('postMessage') ||
        event.reason?.message?.includes('clone') ||
        event.reason?.message?.includes('DataCloneError') ||
        event.reason?.message?.includes('serialize') ||
        event.reason?.stack?.includes('gptengineer.js')) {
      console.warn('Suppressed non-critical promise error:', event.reason?.message);
      event.preventDefault();
      return;
    }
    
    // Ignore network-related errors
    if (isNetworkError(event.reason)) {
      handleNetworkError(event.reason);
      event.preventDefault();
      return;
    }
    
    // Handle Firebase promise errors
    if (isFirebaseError(event.reason)) {
      handleFirebaseError(event.reason);
      
      // Prevent the default error handling
      event.preventDefault();
      return;
    }

    const errorInfo = {
      message: typeof event.reason === 'string' ? event.reason : 
               event.reason?.message || 'Unknown error',
      type: 'Promise Error',
      timestamp: new Date().toISOString()
    };
    
    console.error('Unhandled Promise:', errorInfo);
    event.preventDefault();
  });
}
