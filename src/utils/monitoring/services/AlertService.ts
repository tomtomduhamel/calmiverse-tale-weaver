
import { AlertThresholds, AlertType, PerformanceMetrics } from '../types';
import { DEFAULT_ALERT_THRESHOLDS, ALERT_COOLDOWN_MS } from '../constants/thresholds';
import { LogService } from './LogService';
import { StatsService } from './StatsService';

export class AlertService {
  private static alertThresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS;
  private static lastAlertTime = 0;
  private static activeOperations = new Set<string>();

  static updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...thresholds
    };
    LogService.record('Alert thresholds updated', 'system', this.alertThresholds);
  }

  static checkThresholds(metric: PerformanceMetrics, storyId: string): void {
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

  static addOperation(storyId: string): void {
    if (this.activeOperations.size >= this.alertThresholds.concurrentOperationsThreshold) {
      this.triggerAlert('HIGH_CONCURRENT_OPERATIONS', {
        current: this.activeOperations.size,
        threshold: this.alertThresholds.concurrentOperationsThreshold
      });
    }
    this.activeOperations.add(storyId);
  }

  static removeOperation(storyId: string): void {
    this.activeOperations.delete(storyId);
  }

  private static triggerAlert(type: AlertType, data: any): void {
    const now = Date.now();
    if (now - this.lastAlertTime < ALERT_COOLDOWN_MS) {
      return;
    }
    this.lastAlertTime = now;

    LogService.error(type, {
      ...data,
      activeOperations: this.activeOperations.size,
      errorRates: StatsService.calculateErrorRates()
    });
  }
}
