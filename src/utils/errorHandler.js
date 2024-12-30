import { cloneErrorHandler } from './cloneErrorHandler';

export function initializeErrorHandlers() {
  window.addEventListener('error', function(event) {
    if (event.target?.tagName === 'LINK' || event.target?.tagName === 'SCRIPT') {
      return false;
    }
    
    cloneErrorHandler.handleError(event.error || event, 'Global Error');
    return false;
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    cloneErrorHandler.handleError(event.reason, 'Unhandled Promise');
    event.preventDefault();
  });

  console.log('Application initialized with enhanced error handling');
}