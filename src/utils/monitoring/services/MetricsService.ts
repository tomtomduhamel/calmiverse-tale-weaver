
import type { PerformanceMetrics, NetworkStats, ProcessingStep } from '../types';
import { AlertService } from './AlertService';
import { LogService } from './LogService';
import { StatsService } from './StatsService';

export class MetricsService {
  private static metrics = new Map<string, PerformanceMetrics>();

  static startOperation(storyId: string): void {
    AlertService.addOperation(storyId);
    StatsService.incrementOperations();

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
    LogService.record('OPERATION_STARTED', storyId, metrics);
  }

  static endOperation(storyId: string, status: 'success' | 'error' | 'timeout' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;

      if (status === 'error') {
        StatsService.incrementErrorCount(StatsService.getCurrentHour());
      }

      AlertService.checkThresholds(metric, storyId);
      LogService.record('OPERATION_COMPLETED', storyId, metric);
      AlertService.removeOperation(storyId);
    }
  }

  static addProcessingStep(storyId: string, step: string, status: 'success' | 'error' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric && metric.processingStats) {
      const processingStep: ProcessingStep = {
        step,
        duration: Date.now() - metric.startTime,
        status,
        timestamp: new Date().toISOString()
      };
      metric.processingStats.processingSteps.push(processingStep);
    }
  }

  static setNetworkStats(storyId: string, stats: NetworkStats): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.networkStats = stats;
    }
  }

  static getMetrics(storyId: string): PerformanceMetrics | undefined {
    return this.metrics.get(storyId);
  }

  static clearMetrics(storyId: string): void {
    this.metrics.delete(storyId);
    AlertService.removeOperation(storyId);
  }
}
