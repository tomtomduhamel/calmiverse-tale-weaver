/**
 * System Health Monitor - Phase 3 Commercial Publication
 * Surveillance de la santé du système en temps réel
 */

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: number;
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: number;
  metrics: HealthMetric[];
  issues: string[];
  recommendations: string[];
}

interface PerformanceEntry {
  timestamp: number;
  metric: string;
  value: number;
  context?: Record<string, any>;
}

class SystemHealthMonitor {
  private metrics = new Map<string, HealthMetric>();
  private performanceHistory: PerformanceEntry[] = [];
  private maxHistorySize = 1000;
  private monitoring = false;
  private observers: PerformanceObserver[] = [];
  private startTime = Date.now();

  constructor() {
    this.initializeMetrics();
    this.setupPerformanceObservers();
  }

  /**
   * Initialise les métriques par défaut
   */
  private initializeMetrics(): void {
    const defaultMetrics: Omit<HealthMetric, 'lastUpdated'>[] = [
      {
        name: 'memory_usage',
        value: 0,
        unit: 'MB',
        threshold: { warning: 100, critical: 200 },
        status: 'healthy'
      },
      {
        name: 'dom_nodes',
        value: 0,
        unit: 'count',
        threshold: { warning: 5000, critical: 10000 },
        status: 'healthy'
      },
      {
        name: 'network_latency',
        value: 0,
        unit: 'ms',
        threshold: { warning: 1000, critical: 3000 },
        status: 'healthy'
      },
      {
        name: 'error_rate',
        value: 0,
        unit: '%',
        threshold: { warning: 5, critical: 15 },
        status: 'healthy'
      },
      {
        name: 'cpu_usage',
        value: 0,
        unit: '%',
        threshold: { warning: 70, critical: 90 },
        status: 'healthy'
      },
      {
        name: 'render_time',
        value: 0,
        unit: 'ms',
        threshold: { warning: 16, critical: 33 },
        status: 'healthy'
      }
    ];

    defaultMetrics.forEach(metric => {
      this.metrics.set(metric.name, {
        ...metric,
        lastUpdated: Date.now()
      });
    });
  }

  /**
   * Configure les observateurs de performance
   */
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Observer pour les événements de navigation
    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformance('navigation', entry.duration, {
            type: entry.entryType,
            name: entry.name
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }

    // Observer pour les ressources
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformance('resource_load', entry.duration, {
            type: entry.entryType,
            name: entry.name
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }

    // Observer pour les mesures personnalisées
    try {
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformance('measure', entry.duration, {
            type: entry.entryType,
            name: entry.name
          });
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (e) {
      console.warn('Measure observer not supported');
    }
  }

  /**
   * Démarre la surveillance
   */
  startMonitoring(interval = 5000): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    
    const monitor = async () => {
      if (!this.monitoring) return;
      
      await this.updateAllMetrics();
      setTimeout(monitor, interval);
    };
    
    monitor();
  }

  /**
   * Arrête la surveillance
   */
  stopMonitoring(): void {
    this.monitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Met à jour toutes les métriques
   */
  private async updateAllMetrics(): Promise<void> {
    await Promise.all([
      this.updateMemoryUsage(),
      this.updateDOMNodes(),
      this.updateNetworkLatency(),
      this.updateCPUUsage(),
      this.updateRenderTime()
    ]);
  }

  /**
   * Met à jour l'utilisation mémoire
   */
  private async updateMemoryUsage(): Promise<void> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageInMB = memory.usedJSHeapSize / (1024 * 1024);
      this.updateMetric('memory_usage', usageInMB);
    }
  }

  /**
   * Met à jour le nombre de nœuds DOM
   */
  private updateDOMNodes(): void {
    const nodeCount = document.querySelectorAll('*').length;
    this.updateMetric('dom_nodes', nodeCount);
  }

  /**
   * Met à jour la latence réseau
   */
  private async updateNetworkLatency(): Promise<void> {
    try {
      const start = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD' });
      const latency = performance.now() - start;
      this.updateMetric('network_latency', latency);
    } catch (error) {
      this.updateMetric('network_latency', 9999); // Valeur élevée en cas d'erreur
    }
  }

  /**
   * Estime l'utilisation CPU
   */
  private updateCPUUsage(): void {
    const start = performance.now();
    
    // Tâche intensive pour mesurer la performance
    let iterations = 0;
    const targetTime = 10; // 10ms de travail
    
    while (performance.now() - start < targetTime) {
      iterations++;
    }
    
    const actualTime = performance.now() - start;
    const efficiency = (targetTime / actualTime) * 100;
    const cpuUsage = Math.max(0, 100 - efficiency);
    
    this.updateMetric('cpu_usage', Math.min(cpuUsage, 100));
  }

  /**
   * Met à jour le temps de rendu
   */
  private updateRenderTime(): void {
    if ('getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcp && 'startTime' in fcp) {
        this.updateMetric('render_time', fcp.startTime);
      }
    }
  }

  /**
   * Met à jour une métrique spécifique
   */
  updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name);
    if (!metric) return;

    metric.value = value;
    metric.lastUpdated = Date.now();
    
    // Détermine le statut basé sur les seuils
    if (value >= metric.threshold.critical) {
      metric.status = 'critical';
    } else if (value >= metric.threshold.warning) {
      metric.status = 'warning';
    } else {
      metric.status = 'healthy';
    }
    
    this.metrics.set(name, metric);
  }

  /**
   * Enregistre une entrée de performance
   */
  recordPerformance(metric: string, value: number, context?: Record<string, any>): void {
    const entry: PerformanceEntry = {
      timestamp: Date.now(),
      metric,
      value,
      context
    };
    
    this.performanceHistory.push(entry);
    
    // Limite la taille de l'historique
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Retourne le statut global du système
   */
  getSystemStatus(): SystemStatus {
    const metrics = Array.from(this.metrics.values());
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (warningCount > 0) {
      overall = 'warning';
    }
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    metrics.forEach(metric => {
      if (metric.status === 'critical') {
        issues.push(`${metric.name}: ${metric.value}${metric.unit} (critique)`);
        recommendations.push(this.getRecommendation(metric.name));
      } else if (metric.status === 'warning') {
        issues.push(`${metric.name}: ${metric.value}${metric.unit} (attention)`);
      }
    });
    
    return {
      overall,
      uptime: Date.now() - this.startTime,
      metrics,
      issues,
      recommendations: [...new Set(recommendations)] // Supprime les doublons
    };
  }

  /**
   * Retourne une recommandation pour une métrique problématique
   */
  private getRecommendation(metricName: string): string {
    const recommendations: Record<string, string> = {
      memory_usage: 'Optimisez l\'utilisation mémoire en supprimant les références inutiles',
      dom_nodes: 'Réduisez la complexité du DOM ou implémentez la virtualisation',
      network_latency: 'Vérifiez votre connexion réseau ou utilisez un CDN',
      error_rate: 'Corrigez les erreurs récurrentes dans l\'application',
      cpu_usage: 'Optimisez les calculs intensifs ou réduisez la fréquence de traitement',
      render_time: 'Optimisez les styles CSS et réduisez les reflows'
    };
    
    return recommendations[metricName] || 'Surveillez cette métrique de près';
  }

  /**
   * Retourne l'historique de performance pour une métrique
   */
  getPerformanceHistory(metric?: string, limit = 100): PerformanceEntry[] {
    let history = this.performanceHistory;
    
    if (metric) {
      history = history.filter(entry => entry.metric === metric);
    }
    
    return history.slice(-limit);
  }

  /**
   * Calcule des statistiques de performance
   */
  getPerformanceStats(metric: string, timeWindow = 3600000): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const entries = this.performanceHistory
      .filter(entry => entry.metric === metric && entry.timestamp > cutoff)
      .map(entry => entry.value);
    
    if (entries.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: entries.reduce((sum, val) => sum + val, 0) / entries.length,
      min: Math.min(...entries),
      max: Math.max(...entries),
      count: entries.length
    };
  }

  /**
   * Nettoie l'historique ancien
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.performanceHistory = this.performanceHistory.filter(
      entry => entry.timestamp > cutoff
    );
  }
}

// Instance globale du moniteur de santé
export const systemHealthMonitor = new SystemHealthMonitor();