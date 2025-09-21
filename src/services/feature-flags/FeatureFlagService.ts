interface FeatureFlags {
  // Phase 6 feature flags
  backgroundStoryGeneration: boolean;
  nativeNotifications: boolean;
  storyGenerationQueue: boolean;
  migrationTesting: boolean;
  rollbackEnabled: boolean;
  
  // A/B testing flags
  abTestGroup: 'control' | 'background' | 'hybrid';
  userId?: string;
}

interface FeatureFlagConfig {
  rolloutPercentage: number;
  enabledUsers: string[];
  disabledUsers: string[];
  version: string;
}

/**
 * Service de gestion des feature flags pour la migration progressive
 * Permet de basculer entre ancien et nouveau système de notifications
 */
export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags = {
    backgroundStoryGeneration: false,
    nativeNotifications: false,
    storyGenerationQueue: false,
    migrationTesting: true,
    rollbackEnabled: true,
    abTestGroup: 'control'
  };
  
  private config: FeatureFlagConfig = {
    rolloutPercentage: 10, // 10% des utilisateurs par défaut
    enabledUsers: [],
    disabledUsers: [],
    version: '1.0.0'
  };

  private constructor() {
    this.loadFromStorage();
    this.initializeForUser();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Initialise les flags pour un utilisateur spécifique
   */
  initializeForUser(userId?: string): void {
    if (!userId) return;
    
    this.flags.userId = userId;
    
    // Vérifier si l'utilisateur est dans une liste spécifique
    if (this.config.enabledUsers.includes(userId)) {
      this.enableAllFeatures();
      return;
    }
    
    if (this.config.disabledUsers.includes(userId)) {
      this.disableAllFeatures();
      return;
    }
    
    // Assignment A/B basé sur le hash de l'userId
    const hash = this.hashUserId(userId);
    const percentage = hash % 100;
    
    if (percentage < this.config.rolloutPercentage) {
      this.flags.abTestGroup = 'background';
      this.enableAllFeatures();
    } else if (percentage < this.config.rolloutPercentage * 2) {
      this.flags.abTestGroup = 'hybrid';
      this.enableHybridFeatures();
    } else {
      this.flags.abTestGroup = 'control';
      this.disableAllFeatures();
    }
    
    this.saveToStorage();
    console.log('[FeatureFlagService] Flags initialisés pour utilisateur:', userId, this.flags);
  }

  /**
   * Obtient la valeur d'un feature flag
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] === true;
  }

  /**
   * Active toutes les nouvelles fonctionnalités
   */
  enableAllFeatures(): void {
    this.flags = {
      ...this.flags,
      backgroundStoryGeneration: true,
      nativeNotifications: true,
      storyGenerationQueue: true,
      abTestGroup: 'background'
    };
    this.saveToStorage();
  }

  /**
   * Désactive toutes les nouvelles fonctionnalités (rollback)
   */
  disableAllFeatures(): void {
    this.flags = {
      ...this.flags,
      backgroundStoryGeneration: false,
      nativeNotifications: false,
      storyGenerationQueue: false,
      abTestGroup: 'control'
    };
    this.saveToStorage();
  }

  /**
   * Active un mode hybride (certaines fonctionnalités seulement)
   */
  enableHybridFeatures(): void {
    this.flags = {
      ...this.flags,
      backgroundStoryGeneration: true,
      nativeNotifications: false, // Garder les toasts
      storyGenerationQueue: true,
      abTestGroup: 'hybrid'
    };
    this.saveToStorage();
  }

  /**
   * Force l'activation pour les tests
   */
  enableTestingMode(): void {
    this.flags = {
      ...this.flags,
      backgroundStoryGeneration: true,
      nativeNotifications: true,
      storyGenerationQueue: true,
      migrationTesting: true,
      rollbackEnabled: true,
      abTestGroup: 'background'
    };
    this.saveToStorage();
  }

  /**
   * Obtient le groupe A/B de l'utilisateur
   */
  getABTestGroup(): 'control' | 'background' | 'hybrid' {
    return this.flags.abTestGroup;
  }

  /**
   * Obtient tous les flags actuels
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Met à jour la configuration du rollout
   */
  updateRolloutConfig(config: Partial<FeatureFlagConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }

  /**
   * Hash simple pour l'assignment A/B déterministe
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Sauvegarde les flags en localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('calmiverse_feature_flags', JSON.stringify({
        flags: this.flags,
        config: this.config,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[FeatureFlagService] Erreur sauvegarde:', error);
    }
  }

  /**
   * Charge les flags depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('calmiverse_feature_flags');
      if (stored) {
        const { flags, config, timestamp } = JSON.parse(stored);
        
        // Valider que les flags ne sont pas trop anciens (24h max)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          this.flags = { ...this.flags, ...flags };
          this.config = { ...this.config, ...config };
        }
      }
    } catch (error) {
      console.error('[FeatureFlagService] Erreur chargement:', error);
    }
  }

  /**
   * Log les métriques d'utilisation (pour analytics futures)
   */
  logUsage(feature: keyof FeatureFlags, action: string): void {
    console.log('[FeatureFlagService] Usage:', {
      feature,
      action,
      enabled: this.flags[feature],
      abTestGroup: this.flags.abTestGroup,
      userId: this.flags.userId,
      timestamp: new Date().toISOString()
    });
  }
}