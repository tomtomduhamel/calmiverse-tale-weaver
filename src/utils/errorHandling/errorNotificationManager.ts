
import { NotificationType, NotificationOptions } from "@/types/notification";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

type ErrorCategory = "auth" | "network" | "validation" | "api" | "database" | "unknown";

interface ErrorNotificationConfig {
  type: NotificationType;
  title: string;
  message: string;
  category: ErrorCategory;
  actionLabel?: string;
  retry?: boolean;
}

/**
 * Classe pour gérer les notifications d'erreur de manière centralisée
 * avec une meilleure intégration avec le système de notification global
 */
class ErrorNotificationManager {
  // Singleton instance
  private static instance: ErrorNotificationManager;
  
  // Stockage des handlers d'erreur
  private errorHandlers: ((error: Error | unknown, category?: ErrorCategory) => void)[] = [];
  
  // Map des erreurs fréquentes avec leurs messages conviviaux
  private commonErrors: Map<string, ErrorNotificationConfig> = new Map();
  
  // Référence au système de notification central
  private notifyFn: ((type: NotificationType, title: string, message: string, options?: NotificationOptions) => void) | null = null;
  
  private constructor() {
    this.initializeCommonErrors();
  }
  
  /**
   * Obtenir l'instance singleton
   */
  public static getInstance(): ErrorNotificationManager {
    if (!ErrorNotificationManager.instance) {
      ErrorNotificationManager.instance = new ErrorNotificationManager();
    }
    return ErrorNotificationManager.instance;
  }
  
  /**
   * Initialiser la map des erreurs courantes avec leurs messages conviviaux
   */
  private initializeCommonErrors(): void {
    // Erreurs d'authentification
    this.commonErrors.set("auth/requires-recent-login", {
      type: "warning",
      title: "Session expirée",
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      category: "auth",
      actionLabel: "Se reconnecter",
    });
    
    this.commonErrors.set("auth/user-not-found", {
      type: "error",
      title: "Utilisateur introuvable",
      message: "Aucun compte n'est associé à cette adresse e-mail.",
      category: "auth",
    });
    
    // Erreurs spécifiques à la création d'histoire
    this.commonErrors.set("story/missing-children", {
      type: "warning",
      title: "Sélection requise",
      message: "Veuillez sélectionner au moins un enfant pour créer une histoire.",
      category: "validation",
    });
    
    this.commonErrors.set("story/missing-objective", {
      type: "warning",
      title: "Objectif requis",
      message: "Veuillez sélectionner un objectif pour l'histoire.",
      category: "validation",
    });
    
    // Erreurs réseau
    this.commonErrors.set("network-error", {
      type: "warning",
      title: "Problème de connexion",
      message: "Vérifiez votre connexion internet et réessayez.",
      category: "network",
      retry: true,
    });
    
    // Erreurs API
    this.commonErrors.set("api-rate-limit", {
      type: "warning",
      title: "Limite d'API atteinte",
      message: "Vous avez atteint la limite de requêtes. Veuillez réessayer plus tard.",
      category: "api",
    });
    
    // Erreurs de base de données
    this.commonErrors.set("db-connection-error", {
      type: "error",
      title: "Erreur de base de données",
      message: "Impossible de se connecter à la base de données. Réessayez plus tard.",
      category: "database",
    });
  }
  
  /**
   * Ajouter un gestionnaire d'erreur
   */
  public addErrorHandler(handler: (error: Error | unknown, category?: ErrorCategory) => void): void {
    this.errorHandlers.push(handler);
  }
  
  /**
   * Supprimer un gestionnaire d'erreur
   */
  public removeErrorHandler(handler: (error: Error | unknown, category?: ErrorCategory) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }
  
  /**
   * Gérer et notifier une erreur
   */
  public handleError(error: Error | unknown, category: ErrorCategory = 'unknown'): ErrorNotificationConfig {
    console.error(`[ErrorManager] ${category} error:`, error);
    
    let errorMessage = '';
    let errorCode = '';
    
    // Extraire le message et le code d'erreur
    if (error instanceof Error) {
      errorMessage = error.message;
      // @ts-ignore - Certaines erreurs ont un code
      errorCode = error.code || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'Une erreur inconnue est survenue';
    }
    
    // Chercher une erreur connue correspondante
    let config: ErrorNotificationConfig | undefined;
    
    // Vérifier le code d'erreur exact
    if (errorCode && this.commonErrors.has(errorCode)) {
      config = this.commonErrors.get(errorCode);
    }
    
    // Si pas trouvé, chercher dans les messages
    if (!config) {
      for (const [key, value] of this.commonErrors.entries()) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          config = value;
          break;
        }
      }
    }
    
    // Configuration par défaut si aucune correspondance
    if (!config) {
      config = {
        type: "error",
        title: "Erreur",
        message: errorMessage || "Une erreur est survenue",
        category: category
      };
    }
    
    // Notifier tous les gestionnaires d'erreur
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, category);
      } catch (handlerError) {
        console.error("[ErrorManager] Error in error handler:", handlerError);
      }
    });
    
    // Créer un événement personnalisé pour le système d'événements
    const errorEvent = new CustomEvent('app-error', {
      detail: {
        error,
        config
      }
    });
    
    document.dispatchEvent(errorEvent);
    
    // Si nous avons un système de notification configuré, l'utiliser directement
    if (this.notifyFn && typeof this.notifyFn === 'function') {
      try {
        const actionOptions = config.actionLabel ? {
          action: {
            label: config.actionLabel,
            onClick: () => {
              document.dispatchEvent(new CustomEvent('error-action', {
                detail: { category: config.category, action: config.actionLabel }
              }));
            }
          }
        } : undefined;
        
        this.notifyFn(
          config.type,
          config.title,
          config.message,
          actionOptions
        );
      } catch (notifyError) {
        console.error("[ErrorManager] Error in notification system:", notifyError);
      }
    }
    
    return config;
  }
  
  /**
   * Intégration avec le système de notification centralisé
   */
  public initWithNotificationCenter(notifyFn: (type: NotificationType, title: string, message: string, options?: NotificationOptions) => void): void {
    // Stocker la référence à la fonction de notification
    this.notifyFn = notifyFn;
    
    // Écouter les événements d'erreur de l'application
    document.addEventListener('app-error', ((event: CustomEvent) => {
      const { config } = event.detail;
      
      if (config && notifyFn) {
        const actionOptions = config.actionLabel ? {
          action: {
            label: config.actionLabel,
            onClick: () => {
              document.dispatchEvent(new CustomEvent('error-action', {
                detail: { category: config.category, action: config.actionLabel }
              }));
            }
          }
        } : undefined;
        
        notifyFn(
          config.type, 
          config.title, 
          config.message,
          actionOptions
        );
      }
    }) as EventListener);
    
    console.log("[ErrorNotificationManager] Initialized with notification center");
  }
  
  /**
   * Méthode utilitaire pour créer une erreur de validation avec notification
   */
  public createValidationError(message: string, errorCode?: string): Error {
    const error = new Error(message);
    // @ts-ignore
    error.code = errorCode || 'validation/form-error';
    
    this.handleError(error, 'validation');
    return error;
  }
}

export const errorManager = ErrorNotificationManager.getInstance();

/**
 * Utilitaire pour la gestion du retentative automatique des opérations qui échouent
 */
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  category: ErrorCategory = 'unknown',
  retryCount = 1
): Promise<T> {
  return new Promise<T>(async (resolve, reject) => {
    let attempts = 0;
    
    const attempt = async () => {
      try {
        attempts++;
        const result = await operation();
        resolve(result);
      } catch (error) {
        console.error(`[withErrorHandling] Error in attempt ${attempts}/${retryCount + 1}:`, error);
        
        const config = errorManager.handleError(error, category);
        
        if (attempts <= retryCount && config.retry) {
          // Attente exponentielle avant de réessayer
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
          console.log(`[withErrorHandling] Retrying in ${delay}ms...`);
          
          setTimeout(attempt, delay);
        } else {
          reject(error);
        }
      }
    };
    
    await attempt();
  });
}
