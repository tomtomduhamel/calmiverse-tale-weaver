export function initializeErrorHandlers() {
  // Global error handler
  window.addEventListener('error', function(event) {
    // Completely ignore all postMessage and clone related errors
    if (event.message?.includes('postMessage') || 
        event.message?.includes('clone') ||
        event.message?.includes('DataCloneError') ||
        event.filename?.includes('gptengineer.js')) {
      event.preventDefault();
      return false;
    }
    
    // Ignore resource loading errors
    if (event.target?.tagName === 'LINK' || 
        event.target?.tagName === 'SCRIPT') {
      return false;
    }
    
    // Create serializable error object
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
    // Completely ignore all postMessage related errors
    if (event.reason?.message?.includes('postMessage') ||
        event.reason?.message?.includes('clone') ||
        event.reason?.message?.includes('DataCloneError') ||
        event.reason?.stack?.includes('gptengineer.js')) {
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

  // Enhanced postMessage handling
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
      const safeMessage = structuredClone(message);
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // Silently handle postMessage errors
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

  console.log('Enhanced error handling initialized with strict postMessage filtering');
}