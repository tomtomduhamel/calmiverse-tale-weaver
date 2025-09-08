/**
 * Performance monitoring for 100+ concurrent users
 * Tracks application performance and capacity metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

interface CapacityMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestTimes: number[] = [];
  private activeRequests = new Set<string>();
  private startTime = Date.now();
  private maxMetrics = 1000;

  // Performance thresholds for 100 users
  private thresholds = {
    responseTime: 2000,      // 2 seconds max
    errorRate: 5,           // 5% max error rate
    requestsPerSecond: 50,  // 50 RPS capacity
    memoryUsage: 80,        // 80% max memory
    networkLatency: 1000    // 1 second max latency
  };

  constructor() {
    this.setupPerformanceObserver();
    this.startCapacityMonitoring();
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(`web-vital-${entry.name}`, (entry as any).value, {
              LCP: 2500,      // Largest Contentful Paint
              FID: 100,       // First Input Delay
              CLS: 0.1        // Cumulative Layout Shift
            }[entry.name]);
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

        // Monitor navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as any;
              this.recordMetric('page-load-time', navEntry.loadEventEnd - navEntry.fetchStart, 3000);
              this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 1500);
              this.recordMetric('time-to-interactive', navEntry.domInteractive - navEntry.fetchStart, 2000);
            }
          }
        });

        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private startCapacityMonitoring() {
    setInterval(() => {
      this.collectCapacityMetrics();
      this.cleanupOldMetrics();
    }, 10000); // Every 10 seconds
  }

  private collectCapacityMetrics() {
    const now = Date.now();
    const last10Seconds = this.requestTimes.filter(time => now - time < 10000);
    const requestsPerSecond = last10Seconds.length / 10;

    this.recordMetric('requests-per-second', requestsPerSecond, this.thresholds.requestsPerSecond);

    // Calculate average response time
    if (this.requestTimes.length > 0) {
      const avgResponseTime = this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
      this.recordMetric('avg-response-time', avgResponseTime, this.thresholds.responseTime);
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      this.recordMetric('memory-usage', memoryUsagePercent, this.thresholds.memoryUsage);
    }

    // Monitor active requests
    this.recordMetric('active-requests', this.activeRequests.size, 20);
  }

  recordRequest(requestId: string, startTime: number) {
    this.activeRequests.add(requestId);
  }

  recordResponse(requestId: string, startTime: number, success: boolean) {
    this.activeRequests.delete(requestId);
    const responseTime = Date.now() - startTime;
    this.requestTimes.push(responseTime);
    
    // Keep only recent request times
    const tenMinutesAgo = Date.now() - 600000;
    this.requestTimes = this.requestTimes.filter(time => time > tenMinutesAgo);

    this.recordMetric('response-time', responseTime, this.thresholds.responseTime);
    
    if (!success) {
      this.recordMetric('error-count', 1);
    }
  }

  private recordMetric(name: string, value: number, threshold?: number) {
    let status: PerformanceMetric['status'] = 'good';
    
    if (threshold) {
      if (value > threshold * 1.5) status = 'critical';
      else if (value > threshold) status = 'warning';
    }

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      threshold,
      status
    };

    this.metrics.push(metric);
  }

  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getCapacityStatus(): CapacityMetrics {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => now - m.timestamp < 300000);

    const avgResponseTime = this.getAverageMetric(last5Minutes, 'response-time');
    const requestsPerSecond = this.getAverageMetric(last5Minutes, 'requests-per-second');
    const errorCount = this.getMetricSum(last5Minutes, 'error-count');
    const totalRequests = this.requestTimes.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      activeUsers: this.estimateActiveUsers(),
      requestsPerSecond,
      averageResponseTime: avgResponseTime,
      errorRate,
      memoryUsage: this.getLatestMetric('memory-usage') || 0,
      cpuUsage: this.estimateCpuUsage(),
      networkLatency: this.getAverageMetric(last5Minutes, 'network-latency')
    };
  }

  private getAverageMetric(metrics: PerformanceMetric[], name: string): number {
    const filtered = metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  private getMetricSum(metrics: PerformanceMetric[], name: string): number {
    return metrics.filter(m => m.name === name).reduce((sum, m) => sum + m.value, 0);
  }

  private getLatestMetric(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name);
    return filtered.length > 0 ? filtered[filtered.length - 1].value : null;
  }

  private estimateActiveUsers(): number {
    // Estimate based on requests per second and typical user behavior
    const rps = this.getLatestMetric('requests-per-second') || 0;
    return Math.ceil(rps / 0.5); // Assuming 0.5 requests per second per active user
  }

  private estimateCpuUsage(): number {
    // Estimate CPU usage based on performance metrics
    const responseTime = this.getLatestMetric('avg-response-time') || 0;
    const normalResponseTime = 500; // Expected normal response time
    return Math.min((responseTime / normalResponseTime) * 50, 100);
  }

  getPerformanceReport() {
    const capacity = this.getCapacityStatus();
    const criticalMetrics = this.metrics.filter(m => m.status === 'critical');
    const warningMetrics = this.metrics.filter(m => m.status === 'warning');

    return {
      capacity,
      health: this.calculateHealthScore(capacity),
      criticalIssues: criticalMetrics.length,
      warningIssues: warningMetrics.length,
      uptime: Date.now() - this.startTime,
      recommendations: this.getOptimizationRecommendations(capacity)
    };
  }

  private calculateHealthScore(capacity: CapacityMetrics): number {
    let score = 100;
    
    // Deduct points for performance issues
    if (capacity.averageResponseTime > this.thresholds.responseTime) score -= 20;
    if (capacity.errorRate > this.thresholds.errorRate) score -= 25;
    if (capacity.requestsPerSecond > this.thresholds.requestsPerSecond * 0.8) score -= 15;
    if (capacity.memoryUsage > this.thresholds.memoryUsage) score -= 20;
    if (capacity.networkLatency > this.thresholds.networkLatency) score -= 10;

    return Math.max(0, score);
  }

  private getOptimizationRecommendations(capacity: CapacityMetrics): string[] {
    const recommendations: string[] = [];

    if (capacity.activeUsers > 80) {
      recommendations.push('Approche de la limite de 100 utilisateurs - préparer la montée en charge');
    }

    if (capacity.averageResponseTime > this.thresholds.responseTime) {
      recommendations.push('Temps de réponse élevé - optimiser les requêtes base de données');
    }

    if (capacity.errorRate > this.thresholds.errorRate) {
      recommendations.push('Taux d\'erreur élevé - vérifier la stabilité des services');
    }

    if (capacity.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Usage mémoire élevé - optimiser le cache et les composants');
    }

    if (capacity.requestsPerSecond > this.thresholds.requestsPerSecond * 0.8) {
      recommendations.push('Charge élevée - activer la mise en cache et optimiser les API');
    }

    return recommendations;
  }

  // Method to be called before network requests
  trackRequest(url: string): string {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.recordRequest(requestId, Date.now());
    return requestId;
  }

  // Method to be called after network requests
  trackResponse(requestId: string, success: boolean, startTime: number) {
    this.recordResponse(requestId, startTime, success);
  }
}

export const performanceMonitor = new PerformanceMonitor();
