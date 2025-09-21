import { useState, useCallback } from 'react';
import { NotificationTester } from '@/services/testing/NotificationTester';
import { FeatureFlagService } from '@/services/feature-flags/FeatureFlagService';
import { useToast } from '@/hooks/use-toast';

interface TestingState {
  isRunning: boolean;
  currentTest: string | null;
  results: any | null;
  error: string | null;
}

/**
 * Hook pour les tests du workflow Phase 6
 * Permet de valider le nouveau système avant déploiement complet
 */
export const useWorkflowTesting = () => {
  const [state, setState] = useState<TestingState>({
    isRunning: false,
    currentTest: null,
    results: null,
    error: null
  });
  
  const { toast } = useToast();
  const featureFlags = FeatureFlagService.getInstance();
  const tester = new NotificationTester();

  /**
   * Lance la suite complète de tests
   */
  const runFullTestSuite = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Suite complète',
      error: null
    }));

    try {
      console.log('[useWorkflowTesting] Démarrage suite complète de tests');
      
      // Activer le mode test temporairement
      const originalFlags = featureFlags.getAllFlags();
      featureFlags.enableTestingMode();
      
      // Lancer les tests
      const results = await tester.runFullTestSuite();
      
      setState(prev => ({
        ...prev,
        results,
        isRunning: false,
        currentTest: null
      }));

      // Notifier le résultat
      if (results.overall.success) {
        toast({
          title: "✅ Tests réussis",
          description: `${results.overall.successRate.toFixed(0)}% de réussite en ${results.overall.totalDuration}ms`,
        });
      } else {
        toast({
          title: "⚠️ Tests échoués",
          description: `Seulement ${results.overall.successRate.toFixed(0)}% de réussite`,
          variant: "destructive"
        });
      }

      // Restaurer les flags originaux (sauf si l'utilisateur veut garder les tests activés)
      // featureFlags.flags = originalFlags; // À implémenter si nécessaire

      return results;
    } catch (error: any) {
      console.error('[useWorkflowTesting] Erreur lors des tests:', error);
      
      setState(prev => ({
        ...prev,
        error: error.message,
        isRunning: false,
        currentTest: null
      }));

      toast({
        title: "❌ Erreur de test",
        description: error.message,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [featureFlags, tester, toast]);

  /**
   * Lance un test rapide pour validation rapide
   */
  const runQuickTest = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Test rapide',
      error: null
    }));

    try {
      console.log('[useWorkflowTesting] Démarrage test rapide');
      
      const success = await tester.runQuickTest();
      
      setState(prev => ({
        ...prev,
        results: { quickTest: { success } },
        isRunning: false,
        currentTest: null
      }));

      if (success) {
        toast({
          title: "✅ Test rapide réussi",
          description: "Le système de base fonctionne correctement",
        });
      } else {
        toast({
          title: "⚠️ Test rapide échoué",
          description: "Vérifiez les permissions et la configuration",
          variant: "destructive"
        });
      }

      return success;
    } catch (error: any) {
      console.error('[useWorkflowTesting] Erreur test rapide:', error);
      
      setState(prev => ({
        ...prev,
        error: error.message,
        isRunning: false,
        currentTest: null
      }));

      toast({
        title: "❌ Erreur test rapide",
        description: error.message,
        variant: "destructive"
      });
      
      return false;
    }
  }, [tester, toast]);

  /**
   * Test spécifique des permissions notifications
   */
  const testNotificationPermissions = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Permissions notifications',
      error: null
    }));

    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées');
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      const success = permission === 'granted';
      
      setState(prev => ({
        ...prev,
        results: { permissions: { permission, success } },
        isRunning: false,
        currentTest: null
      }));

      if (success) {
        toast({
          title: "✅ Permissions accordées",
          description: "Les notifications natives sont disponibles",
        });
      } else {
        toast({
          title: "⚠️ Permissions refusées",
          description: "Les notifications natives ne seront pas disponibles",
          variant: "destructive"
        });
      }

      return success;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isRunning: false,
        currentTest: null
      }));

      toast({
        title: "❌ Erreur permissions",
        description: error.message,
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);

  /**
   * Bascule vers le mode de test complet
   */
  const enableTestingMode = useCallback(() => {
    featureFlags.enableTestingMode();
    
    toast({
      title: "🧪 Mode test activé",
      description: "Toutes les nouvelles fonctionnalités sont maintenant actives",
    });
    
    console.log('[useWorkflowTesting] Mode test activé:', featureFlags.getAllFlags());
  }, [featureFlags, toast]);

  /**
   * Retour au mode normal
   */
  const disableTestingMode = useCallback(() => {
    featureFlags.disableAllFeatures();
    
    toast({
      title: "🔄 Mode normal restauré",
      description: "Retour au système classique",
    });
    
    console.log('[useWorkflowTesting] Mode normal restauré:', featureFlags.getAllFlags());
  }, [featureFlags, toast]);

  /**
   * Obtient le statut des feature flags
   */
  const getFeatureFlagsStatus = useCallback(() => {
    return {
      flags: featureFlags.getAllFlags(),
      abTestGroup: featureFlags.getABTestGroup()
    };
  }, [featureFlags]);

  /**
   * Simule une génération d'histoire pour test
   */
  const simulateStoryGeneration = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Simulation génération',
      error: null
    }));

    try {
      const { StoryGenerationQueue } = await import('@/services/stories/StoryGenerationQueue');
      const queue = StoryGenerationQueue.getInstance();
      
      const testStoryId = `test-story-${Date.now()}`;
      
      // Ajouter à la queue
      await queue.addToQueue({
        id: testStoryId,
        userId: 'test-user',
        childrenIds: ['test-child'],
        objective: 'test',
        status: 'pending',
        createdAt: new Date()
      });

      // Simuler la progression
      setTimeout(() => {
        queue.updateStoryStatus(testStoryId, 'processing');
      }, 1000);

      setTimeout(() => {
        queue.updateStoryStatus(testStoryId, 'completed');
        queue.removeFromQueue(testStoryId);
      }, 3000);

      setState(prev => ({
        ...prev,
        results: { simulation: { storyId: testStoryId, success: true } },
        isRunning: false,
        currentTest: null
      }));

      toast({
        title: "🎭 Simulation lancée",
        description: `Histoire test ${testStoryId} ajoutée à la queue`,
      });

      return testStoryId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isRunning: false,
        currentTest: null
      }));

      return null;
    }
  }, [toast]);

  /**
   * Nettoie les données de test
   */
  const cleanup = useCallback(() => {
    tester.cleanup();
    setState({
      isRunning: false,
      currentTest: null,
      results: null,
      error: null
    });
    
    console.log('[useWorkflowTesting] Nettoyage effectué');
  }, [tester]);

  return {
    ...state,
    runFullTestSuite,
    runQuickTest,
    testNotificationPermissions,
    enableTestingMode,
    disableTestingMode,
    getFeatureFlagsStatus,
    simulateStoryGeneration,
    cleanup
  };
};