export function initializeErrorHandlers() {
  // Gestionnaire d'erreurs global
  window.addEventListener('error', function(event) {
    // Ignore postMessage clone errors as they are not critical
    if (event.message?.includes('postMessage') || 
        event.message?.includes('clone')) {
      console.warn('Non-critical postMessage error:', event.message);
      return false;
    }
    
    // Ignorer les erreurs de chargement de ressources
    if (event.target?.tagName === 'LINK' || 
        event.target?.tagName === 'SCRIPT') {
      return false;
    }
    
    // Créer un objet d'erreur sérialisable
    const errorInfo = {
      message: event.error?.message || event.message,
      type: 'Global Error',
      timestamp: new Date().toISOString()
    };
    
    console.error('Application Error:', errorInfo);
    return false;
  }, true);

  // Gestionnaire de promesses non gérées
  window.addEventListener('unhandledrejection', function(event) {
    // Ignore postMessage related errors
    if (event.reason?.message?.includes('postMessage') ||
        event.reason?.message?.includes('clone')) {
      console.warn('Non-critical postMessage promise error:', event.reason.message);
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

  // Enhanced postMessage handling
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      // For primitive types, send directly
      if (typeof message === 'string' || 
          typeof message === 'number' || 
          typeof message === 'boolean') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }

      // For objects, try to create a safe clone
      const safeMessage = JSON.parse(JSON.stringify(message));
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // If cloning fails, send a safe error message instead
      console.warn('PostMessage serialization failed:', error.message);
      return originalPostMessage.call(
        this,
        { 
          type: 'error', 
          message: 'Message could not be serialized',
          originalType: typeof message
        },
        targetOrigin
      );
    }
  };

  console.log('Enhanced error handling initialized with postMessage protection');
}