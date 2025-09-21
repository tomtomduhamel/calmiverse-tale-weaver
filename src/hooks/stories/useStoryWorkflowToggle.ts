import { useState, useEffect, useCallback } from 'react';
import { FeatureFlagService } from '@/services/feature-flags/FeatureFlagService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface WorkflowState {
  useBackgroundGeneration: boolean;
  useNativeNotifications: boolean;
  useStoryQueue: boolean;
  abTestGroup: 'control' | 'background' | 'hybrid';
  canRollback: boolean;
}

/**
 * Hook pour basculer entre ancien et nouveau workflow de création d'histoires
 * Gère les feature flags et la migration progressive
 */
export const useStoryWorkflowToggle = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const featureFlags = FeatureFlagService.getInstance();
  
  const [state, setState] = useState<WorkflowState>({
    useBackgroundGeneration: false,
    useNativeNotifications: false,
    useStoryQueue: false,
    abTestGroup: 'control',
    canRollback: true
  });

  // Initialiser les feature flags pour l'utilisateur
  useEffect(() => {
    if (user?.id) {
      featureFlags.initializeForUser(user.id);
      updateStateFromFlags();
    }
  }, [user?.id]);

  /**
   * Met à jour l'état local depuis les feature flags
   */
  const updateStateFromFlags = useCallback(() => {
    const flags = featureFlags.getAllFlags();
    
    setState({
      useBackgroundGeneration: flags.backgroundStoryGeneration,
      useNativeNotifications: flags.nativeNotifications,
      useStoryQueue: flags.storyGenerationQueue,
      abTestGroup: flags.abTestGroup,
      canRollback: flags.rollbackEnabled
    });
    
    console.log('[useStoryWorkflowToggle] État mis à jour:', flags);
  }, [featureFlags]);

  /**
   * Détermine quelle fonction de création d'histoire utiliser
   */
  const getStoryCreationMethod = useCallback(() => {
    if (state.useBackgroundGeneration) {
      return 'background'; // Nouveau système avec génération en arrière-plan
    } else {
      return 'blocking'; // Ancien système avec attente
    }
  }, [state.useBackgroundGeneration]);

  /**
   * Détermine quel système de notification utiliser
   */
  const getNotificationMethod = useCallback(() => {
    if (state.useNativeNotifications) {
      return 'native'; // Notifications PWA natives
    } else {
      return 'toast'; // Toasts classiques
    }
  }, [state.useNativeNotifications]);

  /**
   * Vérifie si une fonctionnalité est disponible
   */
  const isFeatureEnabled = useCallback((feature: 'background' | 'notifications' | 'queue') => {
    switch (feature) {
      case 'background':
        return state.useBackgroundGeneration;
      case 'notifications':
        return state.useNativeNotifications;
      case 'queue':
        return state.useStoryQueue;
      default:
        return false;
    }
  }, [state]);

  /**
   * Force l'activation du nouveau workflow (pour tests)
   */
  const enableNewWorkflow = useCallback(() => {
    featureFlags.enableAllFeatures();
    updateStateFromFlags();
    
    featureFlags.logUsage('backgroundStoryGeneration', 'manual_enable');
    
    toast({
      title: "🚀 Nouveau workflow activé",
      description: "Génération en arrière-plan et notifications natives activées",
    });
  }, [featureFlags, updateStateFromFlags, toast]);

  /**
   * Force le retour à l'ancien workflow (rollback)
   */
  const enableOldWorkflow = useCallback(() => {
    if (!state.canRollback) {
      toast({
        title: "⚠️ Rollback désactivé",
        description: "Le rollback n'est pas autorisé pour votre compte",
        variant: "destructive"
      });
      return;
    }
    
    featureFlags.disableAllFeatures();
    updateStateFromFlags();
    
    featureFlags.logUsage('backgroundStoryGeneration', 'manual_rollback');
    
    toast({
      title: "🔄 Ancien workflow restauré",
      description: "Retour au système classique avec attente",
    });
  }, [state.canRollback, featureFlags, updateStateFromFlags, toast]);

  /**
   * Active le mode hybride (certaines fonctionnalités seulement)
   */
  const enableHybridWorkflow = useCallback(() => {
    featureFlags.enableHybridFeatures();
    updateStateFromFlags();
    
    featureFlags.logUsage('backgroundStoryGeneration', 'hybrid_enable');
    
    toast({
      title: "⚡ Mode hybride activé",
      description: "Génération background avec toasts classiques",
    });
  }, [featureFlags, updateStateFromFlags, toast]);

  /**
   * Obtient les hooks appropriés selon le workflow actuel
   */
  const getWorkflowHooks = useCallback(() => {
    if (state.useBackgroundGeneration) {
      return {
        useStoryOperations: () => import('@/hooks/stories/useStoryBackgroundOperations'),
        useNotifications: () => import('@/hooks/notifications/useNotificationHandlers'),
        useMonitoring: () => import('@/hooks/stories/useBackgroundStoryGeneration')
      };
    } else {
      return {
        useStoryOperations: () => import('@/hooks/stories/useStoryOperations'),
        useNotifications: () => import('@/hooks/use-toast'),
        useMonitoring: () => import('@/hooks/stories/useStoryCreationMonitor')
      };
    }
  }, [state.useBackgroundGeneration]);

  /**
   * Obtient les composants appropriés selon le workflow actuel
   */
  const getWorkflowComponents = useCallback(() => {
    if (state.useBackgroundGeneration) {
      return {
        StoryForm: 'StoryFormBackground', // Version avec soumission immédiate
        Library: 'StoryLibraryWithProgress', // Version avec section "En cours"
        Notifications: 'PWANotificationManager' // Gestionnaire notifications natives
      };
    } else {
      return {
        StoryForm: 'StoryFormBlocking', // Version avec attente
        Library: 'StoryLibraryClassic', // Version classique
        Notifications: 'ToastNotificationManager' // Gestionnaire toasts
      };
    }
  }, [state.useBackgroundGeneration]);

  /**
   * Log une action utilisateur pour analytics
   */
  const logUserAction = useCallback((action: string, details?: any) => {
    featureFlags.logUsage('backgroundStoryGeneration', action);
    
    console.log('[useStoryWorkflowToggle] Action utilisateur:', {
      action,
      workflow: getStoryCreationMethod(),
      notifications: getNotificationMethod(),
      abTestGroup: state.abTestGroup,
      details
    });
  }, [featureFlags, getStoryCreationMethod, getNotificationMethod, state.abTestGroup]);

  /**
   * Obtient les métriques actuelles pour reporting
   */
  const getWorkflowMetrics = useCallback(() => {
    return {
      currentWorkflow: getStoryCreationMethod(),
      notificationMethod: getNotificationMethod(),
      abTestGroup: state.abTestGroup,
      featuresEnabled: {
        background: state.useBackgroundGeneration,
        notifications: state.useNativeNotifications,
        queue: state.useStoryQueue
      },
      canRollback: state.canRollback,
      userId: user?.id
    };
  }, [
    getStoryCreationMethod,
    getNotificationMethod,
    state,
    user?.id
  ]);

  return {
    ...state,
    getStoryCreationMethod,
    getNotificationMethod,
    isFeatureEnabled,
    enableNewWorkflow,
    enableOldWorkflow,
    enableHybridWorkflow,
    getWorkflowHooks,
    getWorkflowComponents,
    logUserAction,
    getWorkflowMetrics,
    updateStateFromFlags
  };
};