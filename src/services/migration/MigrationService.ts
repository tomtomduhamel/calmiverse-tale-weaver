import { FeatureFlagService } from '@/services/feature-flags/FeatureFlagService';
import { NotificationTester } from '@/services/testing/NotificationTester';

interface MigrationStats {
  totalUsers: number;
  controlGroup: number;
  backgroundGroup: number;
  hybridGroup: number;
  successRate: number;
  errorRate: number;
  rollbackCount: number;
}

interface MigrationConfig {
  rolloutPercentage: number;
  enabledFeatures: string[];
  testingMode: boolean;
  allowRollback: boolean;
  maxConcurrentMigrations: number;
}

/**
 * Service de migration progressive pour la Phase 6
 * Gère le déploiement graduel du nouveau système de notifications
 */
export class MigrationService {
  private static instance: MigrationService;
  private featureFlags = FeatureFlagService.getInstance();
  private tester = new NotificationTester();
  
  private config: MigrationConfig = {
    rolloutPercentage: 10,
    enabledFeatures: ['backgroundStoryGeneration', 'storyGenerationQueue'],
    testingMode: false,
    allowRollback: true,
    maxConcurrentMigrations: 100
  };

  private stats: MigrationStats = {
    totalUsers: 0,
    controlGroup: 0,
    backgroundGroup: 0,
    hybridGroup: 0,
    successRate: 0,
    errorRate: 0,
    rollbackCount: 0
  };

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Initialise la migration pour un utilisateur
   */
  async initializeMigration(userId: string): Promise<'control' | 'background' | 'hybrid'> {
    console.log('[MigrationService] Initialisation migration pour:', userId);
    
    try {
      // Vérifier si l'utilisateur peut être migré
      if (!this.canMigrateUser(userId)) {
        console.log('[MigrationService] Utilisateur non éligible à la migration:', userId);
        return 'control';
      }

      // Assigner l'utilisateur à un groupe A/B
      this.featureFlags.initializeForUser(userId);
      const group = this.featureFlags.getABTestGroup();
      
      // Mettre à jour les statistiques
      this.updateStats(group);
      
      // Lancer un test rapide pour valider le système
      if (group !== 'control') {
        const testResult = await this.validateUserMigration(userId);
        
        if (!testResult) {
          console.warn('[MigrationService] Test échoué, rollback vers control:', userId);
          this.featureFlags.disableAllFeatures();
          this.stats.rollbackCount++;
          return 'control';
        }
      }

      this.saveToStorage();
      console.log('[MigrationService] Migration initialisée:', userId, group);
      
      return group;
    } catch (error) {
      console.error('[MigrationService] Erreur initialisation migration:', error);
      this.stats.errorRate++;
      return 'control';
    }
  }

  /**
   * Valide la migration pour un utilisateur spécifique
   */
  private async validateUserMigration(userId: string): Promise<boolean> {
    try {
      // Test rapide du système
      const quickTestResult = await this.tester.runQuickTest();
      
      if (quickTestResult) {
        this.stats.successRate++;
        return true;
      } else {
        this.stats.errorRate++;
        return false;
      }
    } catch (error) {
      console.error('[MigrationService] Erreur validation migration:', error);
      this.stats.errorRate++;
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur peut être migré
   */
  private canMigrateUser(userId: string): boolean {
    // Vérifier les limites de migration
    const currentMigrations = this.stats.backgroundGroup + this.stats.hybridGroup;
    
    if (currentMigrations >= this.config.maxConcurrentMigrations) {
      return false;
    }

    // Vérifier si nous sommes en mode test
    if (this.config.testingMode) {
      return true;
    }

    // Logique de pourcentage de rollout
    const hash = this.hashString(userId);
    const percentage = hash % 100;
    
    return percentage < this.config.rolloutPercentage;
  }

  /**
   * Met à jour les statistiques de migration
   */
  private updateStats(group: 'control' | 'background' | 'hybrid'): void {
    this.stats.totalUsers++;
    
    switch (group) {
      case 'control':
        this.stats.controlGroup++;
        break;
      case 'background':
        this.stats.backgroundGroup++;
        break;
      case 'hybrid':
        this.stats.hybridGroup++;
        break;
    }
  }

  /**
   * Effectue un rollback pour un utilisateur
   */
  async rollbackUser(userId: string, reason: string = 'user_request'): Promise<boolean> {
    try {
      console.log('[MigrationService] Rollback utilisateur:', userId, reason);
      
      if (!this.config.allowRollback) {
        console.warn('[MigrationService] Rollback désactivé globalement');
        return false;
      }

      // Désactiver les nouvelles fonctionnalités
      this.featureFlags.disableAllFeatures();
      
      // Mettre à jour les stats
      this.stats.rollbackCount++;
      this.stats.errorRate++;
      
      this.saveToStorage();
      
      console.log('[MigrationService] Rollback effectué avec succès:', userId);
      return true;
    } catch (error) {
      console.error('[MigrationService] Erreur rollback:', error);
      return false;
    }
  }

  /**
   * Lance une migration batch pour plusieurs utilisateurs
   */
  async runBatchMigration(userIds: string[]): Promise<{
    succeeded: string[];
    failed: string[];
    skipped: string[];
  }> {
    const results = {
      succeeded: [] as string[],
      failed: [] as string[],
      skipped: [] as string[]
    };

    console.log('[MigrationService] Démarrage migration batch:', userIds.length, 'utilisateurs');

    for (const userId of userIds) {
      try {
        const group = await this.initializeMigration(userId);
        
        if (group === 'control') {
          results.skipped.push(userId);
        } else {
          results.succeeded.push(userId);
        }
      } catch (error) {
        console.error('[MigrationService] Erreur migration utilisateur:', userId, error);
        results.failed.push(userId);
      }

      // Pause entre les migrations pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[MigrationService] Migration batch terminée:', results);
    return results;
  }

  /**
   * Obtient les statistiques actuelles
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }

  /**
   * Met à jour la configuration de migration
   */
  updateConfig(newConfig: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveToStorage();
    
    console.log('[MigrationService] Configuration mise à jour:', this.config);
  }

  /**
   * Active le mode test pour migration complète
   */
  enableTestingMode(): void {
    this.config.testingMode = true;
    this.config.rolloutPercentage = 100;
    this.saveToStorage();
    
    console.log('[MigrationService] Mode test activé');
  }

  /**
   * Désactive le mode test
   */
  disableTestingMode(): void {
    this.config.testingMode = false;
    this.config.rolloutPercentage = 10; // Retour au pourcentage par défaut
    this.saveToStorage();
    
    console.log('[MigrationService] Mode test désactivé');
  }

  /**
   * Génère un rapport de migration
   */
  generateReport(): {
    summary: MigrationStats;
    config: MigrationConfig;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Analyser les performances
    if (this.stats.errorRate > 10) {
      recommendations.push('Taux d\'erreur élevé (>10%) - Considérer ralentir le rollout');
    }
    
    if (this.stats.rollbackCount > this.stats.totalUsers * 0.05) {
      recommendations.push('Taux de rollback élevé (>5%) - Investiguer les causes');
    }
    
    if (this.stats.successRate > 90) {
      recommendations.push('Taux de succès élevé (>90%) - Considérer accélérer le rollout');
    }
    
    const migrationPercentage = ((this.stats.backgroundGroup + this.stats.hybridGroup) / this.stats.totalUsers) * 100;
    if (migrationPercentage < this.config.rolloutPercentage) {
      recommendations.push('Rollout en retard - Vérifier les critères d\'éligibilité');
    }

    return {
      summary: this.getStats(),
      config: { ...this.config },
      recommendations
    };
  }

  /**
   * Hash simple pour distribution déterministe
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Sauvegarde l'état en localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('calmiverse_migration_service', JSON.stringify({
        config: this.config,
        stats: this.stats,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[MigrationService] Erreur sauvegarde:', error);
    }
  }

  /**
   * Charge l'état depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('calmiverse_migration_service');
      if (stored) {
        const { config, stats, timestamp } = JSON.parse(stored);
        
        // Valider que les données ne sont pas trop anciennes (7 jours max)
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          this.config = { ...this.config, ...config };
          this.stats = { ...this.stats, ...stats };
        }
      }
    } catch (error) {
      console.error('[MigrationService] Erreur chargement:', error);
    }
  }
}