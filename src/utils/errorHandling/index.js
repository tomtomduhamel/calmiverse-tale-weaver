
/**
 * Main error handling module that initializes all error handlers
 */
import { setupGlobalErrorHandler, setupPromiseErrorHandler } from './globalErrorHandlers';
import { setupSafePostMessage } from './postMessageHandler';
import { initializeNotificationManager } from './notificationManager';
import { handleFirebaseError } from './firebaseErrorHandler';
import { handleNetworkError } from './networkErrorHandler';

/**
 * Initializes comprehensive error handlers for the application
 * Configures all error handling subsystems
 */
export function initializeErrorHandlers() {
  console.log("Initializing modular error handling system");
  
  // Setup global error handlers
  setupGlobalErrorHandler();
  
  // Setup promise rejection handlers
  setupPromiseErrorHandler();
  
  // Setup notification system
  initializeNotificationManager();
  
  // Enhanced postMessage handling with safe cloning
  setupSafePostMessage();
  
  console.log('Enhanced error handling initialized with improved organization');
}

// Export individual handlers for direct use in components
export {
  handleFirebaseError,
  handleNetworkError
};
