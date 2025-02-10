
interface PerformanceMetrics {
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
}

export class StoryMetrics {
  private static metrics: Map<string, PerformanceMetrics> = new Map();

  static startOperation(storyId: string): void {
    this.metrics.set(storyId, {
      startTime: Date.now(),
      status: 'success',
      retryCount: 0,
    });
  }

  static endOperation(storyId: string, status: 'success' | 'error' = 'success'): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;
      
      console.log('Story Generation Metrics:', {
        storyId,
        duration: `${metric.duration}ms`,
        status: metric.status,
        retryCount: metric.retryCount,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static incrementRetry(storyId: string): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.retryCount++;
    }
  }

  static logError(storyId: string, error: Error): void {
    const metric = this.metrics.get(storyId);
    if (metric) {
      metric.status = 'error';
      metric.errorDetails = {
        code: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static getMetrics(storyId: string): PerformanceMetrics | undefined {
    return this.metrics.get(storyId);
  }

  static clearMetrics(storyId: string): void {
    this.metrics.delete(storyId);
  }
}
