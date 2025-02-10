
export interface AlertThresholds {
  executionTimeMs: number;
  maxRetries: number;
  errorRateThreshold: number;
  memoryUsageThreshold: number;
  tokenUsageThreshold: number;
  concurrentOperationsThreshold: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error' | 'timeout';
  retryCount: number;
  errorDetails?: {
    code: string;
    message: string;
    timestamp: string;
    stack?: string;
  };
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  processingStats?: {
    wordCount: number;
    tokensUsed: number;
    promptLength: number;
    responseLength: number;
    processingSteps: {
      step: string;
      duration: number;
      status: 'success' | 'error';
      timestamp: string;
    }[];
  };
  networkStats?: {
    requestDuration: number;
    responseSize: number;
    statusCode: number;
  };
}

export class StoryMetrics {
  private static metrics: Map<string, PerformanceMetrics> = new Map();
  private static alertThresholds: AlertThresholds = {
    executionTimeMs: 30000,
    maxRetries: 3,
    errorRateThreshold: 0.05,
    memoryUsageThreshold: 0.8,
    tokenUsageThreshold: 4000,
    concurrentOperationsThreshold: 10
  };
  private static activeOperations: Set<string> = new Set();
  private static errorCounts: { [key: string]: number } = {};
  private static lastAlertTime: number = 0;
  private static readonly ALERT_COOLDOWN = 300000; // 5 minutes

  static startOperation(storyId: string): void {
    if (this.activeOperations.size >= this.alertThresholds.concurrentOperationsThreshold) {
      this.triggerAlert('HIGH_CONCURRENT_OPERATIONS', {
        current: this.activeOperations.size,
        threshold: this.alertThresholds.concurrentOperationsThreshold
      });
    }

    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
      status: 'success',
      retryCount: 0,
      memoryUsage: process.memoryUsage ? {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      } : undefined,
      processingStats: {
        wordCount: 0,
        tokensUsed: 0,
        promptLength: 0,
        responseLength: 0,
        processingSteps: []
      }
    };
    
    this.metrics.set(storyId, metrics);
    this.activeOperations.add(storyId);
    this.logMetric('OPERATION_STARTED', storyId, metrics);
  }

  static endOperation(storyId: string, status: 'success' | 'error' | 'timeout' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;

      if (status === 'error') {
        this.incrementErrorCount(storyId);
      }

      this.checkThresholds(metric, storyId);
      this.logMetric('OPERATION_COMPLETED', storyId, metric);
      this.activeOperations.delete(storyId);

      // Vérification du taux d'erreur global
      const errorRate = this.calculateErrorRate();
      if (errorRate > this.alertThresholds.errorRateThreshold) {
        this.triggerAlert('HIGH_ERROR_RATE', { 
          rate: errorRate, 
          threshold: this.alertThresholds.errorRateThreshold 
        });
      }
    }
  }

  static addProcessingStep(storyId: string, step: string, status: 'success' | 'error' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric && metric.processingStats) {
      metric.processingStats.processingSteps.push({
        step,
        duration: Date.now() - metric.startTime,
        status,
        timestamp: new Date().toISOString()
      });
    }
  }

  static setNetworkStats(storyId: string, stats: PerformanceMetrics['networkStats']): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.networkStats = stats;
    }
  }

  private static checkThresholds(metric: PerformanceMetrics, storyId: string): void {
    if (metric.duration && metric.duration > this.alertThresholds.executionTimeMs) {
      this.triggerAlert('EXECUTION_TIME_EXCEEDED', {
        storyId,
        duration: metric.duration,
        threshold: this.alertThresholds.executionTimeMs
      });
    }

    if (metric.retryCount > this.alertThresholds.maxRetries) {
      this.triggerAlert('MAX_RETRIES_EXCEEDED', {
        storyId,
        retries: metric.retryCount,
        threshold: this.alertThresholds.maxRetries
      });
    }

    if (metric.memoryUsage) {
      const memoryUsageRatio = metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal;
      if (memoryUsageRatio > this.alertThresholds.memoryUsageThreshold) {
        this.triggerAlert('HIGH_MEMORY_USAGE', {
          storyId,
          usage: memoryUsageRatio,
          threshold: this.alertThresholds.memoryUsageThreshold
        });
      }
    }

    if (metric.processingStats?.tokensUsed && 
        metric.processingStats.tokensUsed > this.alertThresholds.tokenUsageThreshold) {
      this.triggerAlert('HIGH_TOKEN_USAGE', {
        storyId,
        tokens: metric.processingStats.tokensUsed,
        threshold: this.alertThresholds.tokenUsageThreshold
      });
    }
  }

  private static triggerAlert(type: string, data: any): void {
    const now = Date.now();
    if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
      return;
    }
    this.lastAlertTime = now;

    console.error(`[ALERT] ${type}:`, {
      ...data,
      timestamp: new Date().toISOString(),
      activeOperations: this.activeOperations.size,
      errorRates: this.calculateErrorRates()
    });
  }

  private static logMetric(event: string, storyId: string, data: any): void {
    console.log(`[Monitoring] ${event}:`, {
      storyId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  private static incrementErrorCount(storyId: string): void {
    const hour = new Date().toISOString().slice(0, 13);
    this.errorCounts[hour] = (this.errorCounts[hour] || 0) + 1;
  }

  private static calculateErrorRate(): number {
    const hour = new Date().toISOString().slice(0, 13);
    const totalOperations = this.metrics.size;
    return totalOperations > 0 ? (this.errorCounts[hour] || 0) / totalOperations : 0;
  }

  private static calculateErrorRates(): { [key: string]: number } {
    const rates: { [key: string]: number } = {};
    Object.entries(this.errorCounts).forEach(([hour, count]) => {
      rates[hour] = count / Math.max(this.metrics.size, 1);
    });
    return rates;
  }

  static getMetrics(storyId: string): PerformanceMetrics | undefined {
    return this.metrics.get(storyId);
  }

  static clearMetrics(storyId: string): void {
    this.metrics.delete(storyId);
    this.activeOperations.delete(storyId);
  }

  static updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...thresholds
    };
    console.log('[Monitoring] Alert thresholds updated:', this.alertThresholds);
  }
}

