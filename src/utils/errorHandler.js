export function initializeErrorHandlers() {
  // Gestionnaire d'erreurs global
  window.addEventListener('error', function(event) {
    // Ignorer les erreurs de chargement de ressources et les erreurs de postMessage
    if (event.target?.tagName === 'LINK' || 
        event.target?.tagName === 'SCRIPT' ||
        event.message?.includes('postMessage')) {
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
    // Ignorer les erreurs de postMessage
    if (event.reason?.message?.includes('postMessage')) {
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

  // Remplacer la fonction postMessage par une version plus robuste
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      // Si le message est une chaîne ou un nombre, l'envoyer directement
      if (typeof message === 'string' || typeof message === 'number') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }

      // Pour les objets, tenter de les sérialiser
      const safeMessage = JSON.parse(JSON.stringify(message));
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // En cas d'échec, envoyer un message d'erreur sérialisable
      console.warn('Non-serializable message converted to error notification');
      return originalPostMessage.call(
        this,
        { type: 'error', message: 'Message could not be serialized' },
        targetOrigin
      );
    }
  };

  console.log('Enhanced error handling initialized with postMessage protection');
}