
/**
 * Module principal de gestion d'erreur qui initialise tous les gestionnaires d'erreur
 */
import { setupGlobalErrorHandler, setupPromiseErrorHandler } from './globalErrorHandlers';
import { setupSafePostMessage } from './postMessageHandler';
import { initializeNotificationManager } from './notificationManager';
import { handleGeneralError } from './generalErrorHandler';
import { handleNetworkError } from './networkErrorHandler';
import { errorManager } from './errorNotificationManager';

/**
 * Initialise les gestionnaires d'erreurs complets pour l'application
 * Configure tous les sous-systèmes de gestion d'erreur
 */
export function initializeErrorHandlers() {
  console.log("Initialisation du système de gestion d'erreurs modulaire");
  
  // Configuration des gestionnaires d'erreur globaux
  setupGlobalErrorHandler();
  
  // Configuration des gestionnaires de rejet de promesse
  setupPromiseErrorHandler();
  
  // Configuration du système de notification
  initializeNotificationManager();
  
  // Gestion améliorée des postMessage avec clonage sécurisé
  setupSafePostMessage();
  
  console.log('Gestion d\'erreurs améliorée initialisée avec une organisation améliorée');
  
  return errorManager; // Retourner l'instance du gestionnaire d'erreurs
}

// Exporter les gestionnaires individuels pour utilisation directe dans les composants
export {
  handleGeneralError,
  handleNetworkError,
  errorManager
};
