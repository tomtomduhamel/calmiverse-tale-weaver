
/**
 * Application-level notification management
 */

/**
 * Initialize the notification manager for application-wide error handling
 */
export function initializeNotificationManager() {
  console.log('Initializing notification manager');
  
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
      notifyWarning: function(title, message) {
        const event = new CustomEvent('app-notification', {
          detail: {
            type: 'warning',
            title: title || 'Attention',
            message: message || 'Soyez vigilant'
          }
        });
        document.dispatchEvent(event);
      },
      notifyInfo: function(title, message) {
        const event = new CustomEvent('app-notification', {
          detail: {
            type: 'info',
            title: title || 'Information',
            message: message || 'Pour votre information'
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
  
  // Add a listener for firebase errors
  document.addEventListener('firebase-error', (event) => {
    console.log('Firebase error event detected:', event.detail.message);
    
    window.appNotificationManager.notifyError(
      'Erreur Firebase',
      event.detail.message || 'Une erreur est survenue avec Firebase'
    );
  });
}
