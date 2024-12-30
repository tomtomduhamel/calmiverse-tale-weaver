export function initializeErrorHandlers() {
  // Gestionnaire d'erreurs global
  window.addEventListener('error', function(event) {
    // Always ignore postMessage and clone errors as they are expected
    if (event.message?.includes('postMessage') || 
        event.message?.includes('clone') ||
        event.message?.includes('DataCloneError')) {
      console.warn('[Expected] PostMessage clone error:', event.message);
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
    // Always ignore postMessage related errors
    if (event.reason?.message?.includes('postMessage') ||
        event.reason?.message?.includes('clone') ||
        event.reason?.message?.includes('DataCloneError')) {
      console.warn('[Expected] PostMessage promise error:', event.reason.message);
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

  // Enhanced postMessage handling with better error prevention
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      // For primitive types and null, send directly
      if (message === null || 
          typeof message === 'string' || 
          typeof message === 'number' || 
          typeof message === 'boolean') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }

      // For objects, try to create a safe clone
      // First attempt to detect non-serializable content
      const safeMessage = JSON.parse(JSON.stringify(message));
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // If cloning fails, send a safe error message instead
      console.warn('[Handled] PostMessage serialization failed:', {
        error: error.message,
        messageType: typeof message,
        attemptedWith: message ? Object.keys(message) : 'null'
      });
      
      return originalPostMessage.call(
        this,
        { 
          type: 'error', 
          message: 'Message could not be serialized',
          originalType: typeof message,
          timestamp: new Date().toISOString()
        },
        targetOrigin
      );
    }
  };

  console.log('Enhanced error handling initialized with postMessage protection');
}