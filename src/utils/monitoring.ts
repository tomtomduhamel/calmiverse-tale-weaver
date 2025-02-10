
export interface AlertThresholds {
  executionTimeMs: number;
  maxRetries: number;
  errorRateThreshold: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error';
  retryCount: number;
  errorDetails?: {
    code: string;
    message: string;
    timestamp: string;
  };
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  processingStats?: {
    wordCount: number;
    tokensUsed: number;
    promptLength: number;
  };
}

export class StoryMetrics {
  private static metrics: Map<string, PerformanceMetrics> = new Map();
  private static alertThresholds: AlertThresholds = {
    executionTimeMs: 30000, // 30 seconds
    maxRetries: 3,
    errorRateThreshold: 0.05 // 5%
  };

  static startOperation(storyId: string): void {
    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
      status: 'success',
      retryCount: 0,
      memoryUsage: process.memoryUsage ? {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      } : undefined
    };
    
    this.metrics.set(storyId, metrics);
    console.log(`[Monitoring] Started operation for story ${storyId}`, {
      timestamp: new Date().toISOString(),
      metrics
    });
  }

  static endOperation(storyId: string, status: 'success' | 'error' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;

      if (metric.duration > this.alertThresholds.executionTimeMs) {
        console.warn(`[Alert] Story generation exceeded time threshold`, {
          storyId,
          duration: metric.duration,
          threshold: this.alertThresholds.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }

      if (metric.retryCount > this.alertThresholds.maxRetries) {
        console.warn(`[Alert] Story generation exceeded retry threshold`, {
          storyId,
          retries: metric.retryCount,
          threshold: this.alertThresholds.maxRetries,
          timestamp: new Date().toISOString()
        });
      }

      console.log('[Monitoring] Story Generation Complete:', {
        storyId,
        duration: `${metric.duration}ms`,
        status: metric.status,
        retryCount: metric.retryCount,
        memoryUsage: metric.memoryUsage,
        processingStats: metric.processingStats,
        timestamp: new Date().toISOString()
      });
    }
  }

  static setProcessingStats(storyId: string, stats: PerformanceMetrics['processingStats']): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.processingStats = stats;
    }
  }

  static incrementRetry(storyId: string): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.retryCount++;
      console.log(`[Monitoring] Retry attempt for story ${storyId}`, {
        retryCount: metric.retryCount,
        timestamp: new Date().toISOString()
      });
    }
  }

  static logError(storyId: string, error: Error): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.status = 'error';
      metric.errorDetails = {
        code: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      };

      console.error('[Monitoring] Story Generation Error:', {
        storyId,
        error: metric.errorDetails,
        metrics: this.getMetrics(storyId)
      });
    }
  }

  static getMetrics(storyId: string): PerformanceMetrics | undefined {
    return this.metrics.get(storyId);
  }

  static clearMetrics(storyId: string): void {
    this.metrics.delete(storyId);
  }

  static updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...thresholds
    };
  }

  static getErrorRate(): number {
    const allMetrics = Array.from(this.metrics.values());
    const totalOperations = allMetrics.length;
    const errorCount = allMetrics.filter(m => m.status === 'error').length;
    return totalOperations > 0 ? errorCount / totalOperations : 0;
  }
}

