
export function initializeErrorHandlers() {
  // Global error handler
  window.addEventListener('error', function(event) {
    // Ignore network-related errors for Firebase services
    if (event.target?.tagName === 'LINK' || 
        event.target?.tagName === 'SCRIPT' ||
        event.message?.includes('net::ERR_TIMED_OUT') ||
        event.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.warn('Network error ignored:', event.message);
      event.preventDefault();
      return false;
    }
    
    // Completely ignore all postMessage and clone related errors
    if (event.message?.includes('postMessage') || 
        event.message?.includes('clone') ||
        event.message?.includes('DataCloneError') ||
        event.filename?.includes('gptengineer.js')) {
      event.preventDefault();
      return false;
    }
    
    // Handle Firebase errors more gracefully
    const isFirebaseError = 
      event.message?.includes('firebase') || 
      event.message?.includes('firestore') || 
      event.message?.includes('INTERNAL');
      
    if (isFirebaseError) {
      console.error('Firebase Error:', {
        message: event.error?.message || event.message,
        code: event.error?.code,
        details: event.error?.details
      });
      
      // You could dispatch a custom event to show a user-friendly error
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
    // Ignore network-related errors
    if (event.reason?.message?.includes('net::ERR_TIMED_OUT') ||
        event.reason?.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.warn('Network promise error ignored:', event.reason.message);
      event.preventDefault();
      return;
    }

    // Completely ignore all postMessage related errors
    if (event.reason?.message?.includes('postMessage') ||
        event.reason?.message?.includes('clone') ||
        event.reason?.message?.includes('DataCloneError') ||
        event.reason?.stack?.includes('gptengineer.js')) {
      event.preventDefault();
      return;
    }
    
    // Handle Firebase promise errors
    const isFirebaseError = 
      event.reason?.message?.includes('firebase') || 
      event.reason?.message?.includes('firestore') || 
      event.reason?.message?.includes('INTERNAL') ||
      event.reason?.code?.includes('auth/') ||
      event.reason?.code?.includes('firestore/');
      
    if (isFirebaseError) {
      console.error('Firebase Promise Error:', {
        message: event.reason?.message,
        code: event.reason?.code,
        details: event.reason?.details
      });
      
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
    // You could show a toast message here
    console.log('Firebase error event detected:', event.detail.message);
  });

  // Enhanced postMessage handling
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      if (message === null || 
          typeof message === 'string' || 
          typeof message === 'number' || 
          typeof message === 'boolean') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }

      const safeMessage = structuredClone(message);
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      if (error.message?.includes('postMessage') ||
          error.message?.includes('clone') ||
          error.message?.includes('DataCloneError')) {
        return;
      }
      
      console.warn('[Handled] PostMessage error:', {
        error: error.message,
        messageType: typeof message
      });
    }
  };

  console.log('Enhanced error handling initialized with Firebase error detection');
}
