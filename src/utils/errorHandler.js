export function initializeErrorHandlers() {
  // Gestionnaire d'erreurs global
  window.addEventListener('error', function(event) {
    // Ignorer les erreurs de chargement de ressources
    if (event.target?.tagName === 'LINK' || event.target?.tagName === 'SCRIPT') {
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
    // Créer un objet d'erreur sérialisable
    const errorInfo = {
      message: typeof event.reason === 'string' ? event.reason : 
               event.reason?.message || 'Unknown error',
      type: 'Promise Error',
      timestamp: new Date().toISOString()
    };
    
    console.error('Unhandled Promise:', errorInfo);
    event.preventDefault();
  });

  // Désactiver temporairement le script problématique
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      // Vérifier si le message est sérialisable
      JSON.parse(JSON.stringify(message));
      return originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (error) {
      console.warn('Prevented non-serializable postMessage:', {
        message: 'Message could not be cloned - skipping',
        type: 'PostMessage Warning'
      });
      return;
    }
  };

  console.log('Enhanced error handling initialized');
}