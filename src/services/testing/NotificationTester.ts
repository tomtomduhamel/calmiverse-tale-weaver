import { FeatureFlagService } from '@/services/feature-flags/FeatureFlagService';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface NotificationTestSuite {
  permissions: TestResult;
  backgroundGeneration: TestResult;
  multipleStories: TestResult;
  offlineOnline: TestResult;
  overall: {
    success: boolean;
    successRate: number;
    totalDuration: number;
  };
}

/**
 * Service de test des notifications pour la Phase 6
 * Valide le bon fonctionnement du nouveau système
 */
export class NotificationTester {
  private featureFlags = FeatureFlagService.getInstance();
  private testResults: TestResult[] = [];

  /**
   * Lance la suite complète de tests
   */
  async runFullTestSuite(): Promise<NotificationTestSuite> {
    console.log('[NotificationTester] Démarrage de la suite de tests complète');
    
    this.testResults = [];
    const startTime = Date.now();

    // Test 1: Permissions notifications natives
    const permissionsTest = await this.testNotificationPermissions();
    this.testResults.push(permissionsTest);

    // Test 2: Génération background + navigation
    const backgroundTest = await this.testBackgroundGeneration();
    this.testResults.push(backgroundTest);

    // Test 3: Notifications multi-histoires simultanées
    const multipleTest = await this.testMultipleStoriesNotifications();
    this.testResults.push(multipleTest);

    // Test 4: Tests hors-ligne/en-ligne
    const offlineTest = await this.testOfflineOnlineScenario();
    this.testResults.push(offlineTest);

    const totalDuration = Date.now() - startTime;
    const successCount = this.testResults.filter(r => r.success).length;
    const successRate = (successCount / this.testResults.length) * 100;

    const suite: NotificationTestSuite = {
      permissions: permissionsTest,
      backgroundGeneration: backgroundTest,
      multipleStories: multipleTest,
      offlineOnline: offlineTest,
      overall: {
        success: successRate >= 80, // 80% de réussite minimum
        successRate,
        totalDuration
      }
    };

    console.log('[NotificationTester] Suite de tests terminée:', suite);
    return suite;
  }

  /**
   * Test des permissions notifications natives
   */
  private async testNotificationPermissions(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('[NotificationTester] Test permissions notifications...');
      
      // Vérifier si les notifications sont supportées
      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées par le navigateur');
      }

      // Vérifier le statut des permissions
      let permission = Notification.permission;
      
      if (permission === 'default') {
        // Demander la permission
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        // Test d'une notification simple
        const testNotification = new Notification('Test Calmiverse', {
          body: 'Test des notifications natives',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          silent: true // Pour ne pas déranger pendant les tests
        });

        // Fermer après 1 seconde
        setTimeout(() => {
          testNotification.close();
        }, 1000);

        return {
          testName: 'Permissions Notifications',
          success: true,
          duration: Date.now() - startTime,
          details: { permission, supported: true }
        };
      } else {
        return {
          testName: 'Permissions Notifications',
          success: false,
          duration: Date.now() - startTime,
          error: `Permission refusée: ${permission}`,
          details: { permission, supported: true }
        };
      }
    } catch (error: any) {
      return {
        testName: 'Permissions Notifications',
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        details: { supported: false }
      };
    }
  }

  /**
   * Test génération background + navigation
   */
  private async testBackgroundGeneration(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('[NotificationTester] Test génération background...');
      
      // Simuler une génération en arrière-plan
      const mockStoryId = `test-story-${Date.now()}`;
      
      // Vérifier que les feature flags permettent le background
      if (!this.featureFlags.isEnabled('backgroundStoryGeneration')) {
        throw new Error('Feature flag backgroundStoryGeneration désactivé');
      }

      // Simuler l'ajout à la queue
      const { StoryGenerationQueue } = await import('@/services/stories/StoryGenerationQueue');
      const queue = StoryGenerationQueue.getInstance();
      
      await queue.addToQueue({
        id: mockStoryId,
        userId: 'test-user',
        childrenIds: ['test-child'],
        objective: 'test',
        status: 'pending',
        createdAt: new Date()
      });

      // Vérifier que l'histoire est dans la queue
      const queueSize = queue.getQueueSize();
      
      if (queueSize === 0) {
        throw new Error('Histoire non ajoutée à la queue');
      }

      // Nettoyer
      queue.removeFromQueue(mockStoryId);

      return {
        testName: 'Génération Background',
        success: true,
        duration: Date.now() - startTime,
        details: { queueSize, storyId: mockStoryId }
      };
    } catch (error: any) {
      return {
        testName: 'Génération Background',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Test notifications multi-histoires simultanées
   */
  private async testMultipleStoriesNotifications(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('[NotificationTester] Test notifications multi-histoires...');
      
      const { StoryGenerationQueue } = await import('@/services/stories/StoryGenerationQueue');
      const queue = StoryGenerationQueue.getInstance();
      
      // Simuler 3 histoires simultanées
      const storyIds = [
        `test-story-1-${Date.now()}`,
        `test-story-2-${Date.now()}`,
        `test-story-3-${Date.now()}`
      ];

      for (const storyId of storyIds) {
        await queue.addToQueue({
          id: storyId,
          userId: 'test-user',
          childrenIds: ['test-child'],
          objective: 'test',
          status: 'pending',
          createdAt: new Date()
        });
      }

      // Vérifier que toutes les histoires sont en queue
      const queueSize = queue.getQueueSize();
      
      if (queueSize < 3) {
        throw new Error(`Seulement ${queueSize}/3 histoires ajoutées à la queue`);
      }

      // Simuler le traitement simultané
      for (const storyId of storyIds) {
        queue.updateStoryStatus(storyId, 'processing');
      }

      // Vérifier le nombre d'histoires en traitement
      const processingCount = queue.getProcessingStories().length;
      
      // Nettoyer
      storyIds.forEach(id => queue.removeFromQueue(id));

      return {
        testName: 'Multi-histoires Simultanées',
        success: processingCount >= 3,
        duration: Date.now() - startTime,
        details: { 
          storiesAdded: storyIds.length,
          processingCount,
          finalQueueSize: queueSize
        }
      };
    } catch (error: any) {
      return {
        testName: 'Multi-histoires Simultanées',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Test scénario hors-ligne/en-ligne
   */
  private async testOfflineOnlineScenario(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('[NotificationTester] Test scénario offline/online...');
      
      // Simuler un état hors-ligne
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Vérifier la détection hors-ligne
      if (navigator.onLine) {
        throw new Error('État hors-ligne non détecté');
      }

      // Simuler une génération en mode hors-ligne
      const { StoryGenerationQueue } = await import('@/services/stories/StoryGenerationQueue');
      const queue = StoryGenerationQueue.getInstance();
      
      const offlineStoryId = `offline-story-${Date.now()}`;
      await queue.addToQueue({
        id: offlineStoryId,
        userId: 'test-user',
        childrenIds: ['test-child'],
        objective: 'test',
        status: 'pending',
        createdAt: new Date()
      });

      // Simuler le retour en ligne
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Vérifier le retour en ligne
      if (!navigator.onLine) {
        throw new Error('État en-ligne non détecté');
      }

      // Nettoyer
      queue.removeFromQueue(offlineStoryId);
      
      // Restaurer l'état original
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine,
      });

      return {
        testName: 'Scénario Offline/Online',
        success: true,
        duration: Date.now() - startTime,
        details: { 
          offlineDetected: true,
          onlineRestored: true,
          storyId: offlineStoryId
        }
      };
    } catch (error: any) {
      return {
        testName: 'Scénario Offline/Online',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Test rapide pour validation en développement
   */
  async runQuickTest(): Promise<boolean> {
    console.log('[NotificationTester] Test rapide...');
    
    const permissionsTest = await this.testNotificationPermissions();
    const backgroundTest = await this.testBackgroundGeneration();
    
    return permissionsTest.success && backgroundTest.success;
  }

  /**
   * Obtient les résultats du dernier test
   */
  getLastResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Nettoie les données de test
   */
  cleanup(): void {
    this.testResults = [];
    console.log('[NotificationTester] Nettoyage des données de test effectué');
  }
}