export function initializeErrorHandlers() {
  // Simple error logging without complex serialization
  window.addEventListener('error', function(event) {
    // Ignore resource loading errors
    if (event.target?.tagName === 'LINK' || event.target?.tagName === 'SCRIPT') {
      return false;
    }
    
    console.error('Application Error:', {
      message: event.error?.message || event.message,
      type: 'Global Error'
    });
    
    return false;
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise:', {
      message: event.reason?.message || event.reason,
      type: 'Promise Error'
    });
    event.preventDefault();
  });

  console.log('Basic error handling initialized');
}