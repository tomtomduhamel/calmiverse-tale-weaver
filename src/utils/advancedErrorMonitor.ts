/**
 * Advanced error monitoring integration
 * Production-ready error tracking with detailed context
 */

interface ErrorContext {
  userId?: string;
  component?: string;
  route?: string;
  userAgent?: string;
  timestamp: string;
  sessionId?: string;
  buildVersion?: string;
}

interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  uniqueErrors: number;
  affectedUsers: Set<string>;
  criticalErrors: number;
}

class AdvancedErrorMonitor {
  private sessionId: string;
  private buildVersion: string;
  private errorQueue: Array<{ error: any; context: ErrorContext }> = [];
  private metrics: ErrorMetrics;
  private maxQueueSize = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.metrics = {
      errorCount: 0,
      errorRate: 0,
      uniqueErrors: 0,
      affectedUsers: new Set(),
      criticalErrors: 0
    };

    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers() {
    // Enhanced error handling
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        component: 'Global',
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        userAgent: navigator.userAgent
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        component: 'Promise',
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        userAgent: navigator.userAgent
      });
    });

    // Monitor network errors
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        
        // Log slow requests
        const duration = Date.now() - startTime;
        if (duration > 5000) { // 5 seconds
          this.captureError(new Error(`Slow network request: ${duration}ms`), {
            component: 'Network',
            route: window.location.pathname,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            buildVersion: this.buildVersion
          });
        }

        // Log HTTP errors
        if (!response.ok) {
          this.captureError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            component: 'Network',
            route: window.location.pathname,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            buildVersion: this.buildVersion
          });
        }

        return response;
      } catch (error) {
        this.captureError(error, {
          component: 'Network',
          route: window.location.pathname,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          buildVersion: this.buildVersion
        });
        throw error;
      }
    };
  }

  captureError(error: any, context: Partial<ErrorContext> = {}) {
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      ...context
    };

    // Update metrics
    this.updateMetrics(error, fullContext);

    // Add to queue
    this.errorQueue.push({ error, context: fullContext });
    
    // Manage queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.error('[AdvancedErrorMonitor]', {
        error: error.message || error,
        context: fullContext,
        stack: error.stack
      });
    }

    // Send to error service (production)
    this.sendToErrorService(error, fullContext);

    // Store locally for debugging
    this.persistError(error, fullContext);
  }

  private updateMetrics(error: any, context: ErrorContext) {
    this.metrics.errorCount++;
    
    if (context.userId) {
      this.metrics.affectedUsers.add(context.userId);
    }

    // Determine if critical
    const errorMessage = error.message || error.toString();
    if (this.isCriticalError(errorMessage)) {
      this.metrics.criticalErrors++;
    }

    this.metrics.uniqueErrors = new Set(this.errorQueue.map(e => e.error.message || e.error.toString())).size;
    
    // Calculate error rate (errors per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = this.errorQueue.filter(e => 
      new Date(e.context.timestamp).getTime() > oneMinuteAgo
    );
    this.metrics.errorRate = recentErrors.length;
  }

  private isCriticalError(message: string): boolean {
    const criticalPatterns = [
      'auth',
      'payment',
      'security',
      'database',
      'permission denied',
      'unauthorized',
      'server error 5',
      'network error',
      'timeout'
    ];
    
    return criticalPatterns.some(pattern => 
      message.toLowerCase().includes(pattern)
    );
  }

  private async sendToErrorService(error: any, context: ErrorContext) {
    if (import.meta.env.PROD) {
      // In production, you would integrate with services like:
      // - Sentry
      // - LogRocket
      // - Bugsnag
      // - Custom error endpoint
      
      try {
        // Placeholder for error service integration
        await this.sendToCustomEndpoint(error, context);
      } catch (e) {
        // Don't throw errors from error reporting
        console.warn('Failed to send error to monitoring service:', e);
      }
    }
  }

  private async sendToCustomEndpoint(error: any, context: ErrorContext) {
    // Example custom error endpoint
    const errorData = {
      message: error.message || error.toString(),
      stack: error.stack,
      context,
      metrics: this.getMetricsSummary()
    };

    // This would be your error collection endpoint
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });
  }

  private persistError(error: any, context: ErrorContext) {
    try {
      const errors = this.getStoredErrors();
      errors.push({
        message: error.message || error.toString(),
        stack: error.stack,
        context,
        timestamp: context.timestamp
      });

      // Keep only last 50 errors
      const recentErrors = errors.slice(-50);
      localStorage.setItem('calmi_detailed_errors', JSON.stringify(recentErrors));
    } catch (e) {
      // Ignore storage errors
    }
  }

  getStoredErrors(): any[] {
    try {
      return JSON.parse(localStorage.getItem('calmi_detailed_errors') || '[]');
    } catch (e) {
      return [];
    }
  }

  getMetricsSummary() {
    return {
      ...this.metrics,
      affectedUsers: this.metrics.affectedUsers.size,
      sessionId: this.sessionId,
      buildVersion: this.buildVersion
    };
  }

  // Method for React Error Boundaries
  captureReactError(error: Error, errorInfo: { componentStack?: string }, component?: string) {
    this.captureError(error, {
      component: component || 'React Component',
      route: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }

  // Health check for monitoring
  getHealthStatus() {
    const criticalThreshold = 5; // 5 critical errors per session
    const errorRateThreshold = 10; // 10 errors per minute
    
    return {
      healthy: this.metrics.criticalErrors < criticalThreshold && 
               this.metrics.errorRate < errorRateThreshold,
      metrics: this.getMetricsSummary(),
      lastErrors: this.errorQueue.slice(-5)
    };
  }

  clearErrors() {
    this.errorQueue = [];
    this.metrics = {
      errorCount: 0,
      errorRate: 0,
      uniqueErrors: 0,
      affectedUsers: new Set(),
      criticalErrors: 0
    };
    localStorage.removeItem('calmi_detailed_errors');
  }
}

export const advancedErrorMonitor = new AdvancedErrorMonitor();
