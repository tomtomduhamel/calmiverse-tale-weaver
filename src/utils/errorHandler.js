
/**
 * Initializes comprehensive error handlers for the application
 * Specifically focuses on handling DataCloneError and postMessage errors
 */
export function initializeErrorHandlers() {
  console.log("Initializing error handlers with DataCloneError protection");
  
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
        event.message?.includes('net::ERR_TIMED_OUT') ||
        event.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.warn('Network error ignored:', event.message);
      event.preventDefault();
      return false;
    }
    
    // Handle Firebase errors more gracefully
    const isFirebaseError = 
      event.message?.includes('firebase') || 
      event.message?.includes('firestore') || 
      event.message?.includes('INTERNAL') ||
      event.message?.includes('Failed to get document') ||
      event.message?.includes('FirebaseError');
      
    if (isFirebaseError) {
      console.error('Firebase Error:', {
        message: event.error?.message || event.message,
        code: event.error?.code,
        details: event.error?.details
      });
      
      // Dispatch a custom event to show a user-friendly error
      const customEvent = new CustomEvent('firebase-error', {
        detail: {
          message: event.error?.message || event.message
        }
      });
      document.dispatchEvent(customEvent);
      
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
    if (event.reason?.message?.includes('net::ERR_TIMED_OUT') ||
        event.reason?.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.warn('Network promise error ignored:', event.reason.message);
      event.preventDefault();
      return;
    }
    
    // Handle Firebase promise errors
    const isFirebaseError = 
      event.reason?.message?.includes('firebase') || 
      event.reason?.message?.includes('firestore') || 
      event.reason?.message?.includes('INTERNAL') ||
      event.reason?.code?.includes('auth/') ||
      event.reason?.code?.includes('firestore/') ||
      event.reason?.message?.includes('FirebaseError');
      
    if (isFirebaseError) {
      console.error('Firebase Promise Error:', {
        message: event.reason?.message,
        code: event.reason?.code,
        details: event.reason?.details
      });
      
      // Create a user-friendly error message
      let userMessage = "Une erreur est survenue avec Firebase";
      
      // Check for common error codes
      if (event.reason?.code === 'auth/requires-recent-login') {
        userMessage = "Votre session a expiré. Veuillez vous reconnecter.";
      } else if (event.reason?.code === 'auth/network-request-failed') {
        userMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
      } else if (event.reason?.code?.includes('permission-denied')) {
        userMessage = "Vous n'avez pas les permissions nécessaires pour cette action.";
      } else if (event.reason?.message) {
        userMessage = event.reason.message;
      }
      
      // Dispatch an app notification
      const appEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Erreur Firebase',
          message: userMessage
        }
      });
      document.dispatchEvent(appEvent);
      
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

  // Add a listener for firebase errors
  document.addEventListener('firebase-error', (event) => {
    // Show a toast message for Firebase errors
    console.log('Firebase error event detected:', event.detail.message);
    
    // Dispatch an application-level event for UI components to respond to
    const appEvent = new CustomEvent('app-notification', {
      detail: {
        type: 'error',
        title: 'Erreur Firebase',
        message: event.detail.message || 'Une erreur est survenue avec Firebase'
      }
    });
    document.dispatchEvent(appEvent);
  });

  // Enhanced postMessage handling with safe cloning - remplaçant la version précédente avec une version plus sûre
  const originalPostMessage = window.postMessage;
  window.postMessage = function safePostMessage(message, targetOrigin, transfer) {
    try {
      // Simple primitives can be passed directly
      if (message === null || 
          typeof message === 'string' || 
          typeof message === 'number' || 
          typeof message === 'boolean') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }
      
      // For objects, create a simplified version that can be safely cloned
      let safeMessage;
      try {
        safeMessage = JSON.parse(JSON.stringify(message));
      } catch (jsonError) {
        console.warn('JSON stringify failed, creating simplified message', jsonError);
        safeMessage = simplifyObject(message);
      }
      
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // Si nous rencontrons encore une erreur, la supprimer silencieusement
      console.warn('PostMessage error suppressed:', error.message);
      // Ne pas lever d'erreur qui pourrait interrompre l'exécution
      return undefined;
    }
  };
  
  // Version améliorée de simplifyObject qui est plus tolérante aux erreurs
  function simplifyObject(obj, depth = 0) {
    try {
      // Prevent infinite recursion
      if (depth > 2) return "[Object depth limit]";
      
      // Handle null or primitive types directly
      if (obj === null || typeof obj !== 'object') return obj;
      
      // Handle special objects that may cause cloning issues
      if (obj instanceof Date) return obj.toISOString();
      if (obj instanceof RegExp) return obj.toString();
      if (obj instanceof Error) return { message: obj.message, name: obj.name };
      if (typeof obj.toJSON === 'function') return obj.toJSON();
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => {
          try {
            return simplifyObject(item, depth + 1);
          } catch (e) {
            return "[Non-serializable value]";
          }
        });
      }
      
      // For regular objects, sanitize them by copying only serializable properties
      const result = {};
      
      for (const key in obj) {
        try {
          const value = obj[key];
          
          // Skip functions, DOM nodes, and other non-serializable items
          if (typeof value === 'function') {
            result[key] = "[Function]";
          } else if (value instanceof Node) {
            result[key] = "[DOM Node]";
          } else if (value instanceof Error) {
            result[key] = { message: value.message, name: value.name };
          } else if (value instanceof Request || 
                    value instanceof Response || 
                    value instanceof ReadableStream) {
            result[key] = "[Non-serializable Object]";
          } else if (value === window || 
                    value === document || 
                    (typeof value === 'object' && value !== null && 'window' in value)) {
            result[key] = "[Window Reference]";
          } else {
            // Pour les autres objets, on les simplifie récursivement
            result[key] = simplifyObject(value, depth + 1);
          }
        } catch (e) {
          result[key] = "[Non-serializable value]";
        }
      }
      
      return result;
    } catch (e) {
      // En cas d'erreur, retourner un objet simple plutôt que de planter
      return { error: "Object simplification failed" };
    }
  }

  // Application-level notifications manager
  if (!window.appNotificationManager) {
    window.appNotificationManager = {
      notifyError: function(title, message) {
        const event = new CustomEvent('app-notification', {
          detail: {
            type: 'error',
            title: title || 'Erreur',
            message: message || 'Une erreur est survenue'
          }
        });
        document.dispatchEvent(event);
      },
      notifySuccess: function(title, message) {
        const event = new CustomEvent('app-notification', {
          detail: {
            type: 'success',
            title: title || 'Succès',
            message: message || 'Opération réussie'
          }
        });
        document.dispatchEvent(event);
      },
      notifyRetry: function(storyId) {
        const event = new CustomEvent('app-notification', {
          detail: {
            type: 'retry',
            storyId: storyId
          }
        });
        document.dispatchEvent(event);
      }
    };
  }

  console.log('Enhanced error handling initialized with improved DataCloneError protection');
}
