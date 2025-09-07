/**
 * Production error monitoring and tracking
 * Captures and reports errors for commercial monitoring
 */

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  level: 'error' | 'warning' | 'info';
}

class ProductionErrorMonitor {
  private errors: ErrorReport[] = [];
  private maxStoredErrors = 100;

  captureError(error: Error | string, level: 'error' | 'warning' | 'info' = 'error', context?: Record<string, any>) {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component: context?.component,
      userId: context?.userId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      level
    };

    // Store error locally
    this.errors.push(errorReport);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorMonitor]', errorReport);
    } else if (level === 'error') {
      // In production, only log critical errors
      console.error('Application Error:', errorReport.message);
    }

    // Store in localStorage for persistence
    this.persistErrors();

    // In a real implementation, you would send to error tracking service:
    // await this.sendToErrorService(errorReport);
  }

  private persistErrors() {
    try {
      localStorage.setItem('calmi_error_reports', JSON.stringify(this.errors.slice(-20)));
    } catch (e) {
      // Ignore storage errors
    }
  }

  getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('calmi_error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('calmi_error_reports');
  }

  // Method to be called by error boundaries
  captureReactError(error: Error, errorInfo: { componentStack: string }) {
    this.captureError(error, 'error', {
      component: 'React Error Boundary',
      componentStack: errorInfo.componentStack
    });
  }
}

export const errorMonitor = new ProductionErrorMonitor();

// Global error handler
window.addEventListener('error', (event) => {
  errorMonitor.captureError(event.error || event.message, 'error');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorMonitor.captureError(event.reason, 'error');
});