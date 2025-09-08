/**
 * Edge Function Optimizer - Phase 3 Commercial Publication
 * Optimisation et surveillance des Edge Functions
 */

interface EdgeFunctionCall {
  id: string;
  functionName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  payload?: any;
  response?: any;
  error?: string;
  retryCount: number;
}

interface EdgeFunctionStats {
  functionName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageDuration: number;
  errorRate: number;
  lastCall: number;
  isHealthy: boolean;
}

interface CircuitBreakerState {
  functionName: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  threshold: number;
  timeout: number;
}

class EdgeFunctionOptimizer {
  private calls = new Map<string, EdgeFunctionCall>();
  private stats = new Map<string, EdgeFunctionStats>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private maxCallHistory = 1000;
  private defaultTimeout = 30000;
  private retryDelays = [1000, 2000, 4000]; // Délais de retry exponentiels

  /**
   * Exécute un appel Edge Function optimisé avec retry et circuit breaker
   */
  async executeFunction<T = any>(
    functionName: string,
    payload: any,
    options: {
      timeout?: number;
      maxRetries?: number;
      skipCircuitBreaker?: boolean;
    } = {}
  ): Promise<T> {
    const callId = this.generateCallId();
    const call: EdgeFunctionCall = {
      id: callId,
      functionName,
      startTime: Date.now(),
      success: false,
      payload,
      retryCount: 0
    };

    this.calls.set(callId, call);

    try {
      // Vérifie le circuit breaker
      if (!options.skipCircuitBreaker && !this.isCircuitClosed(functionName)) {
        throw new Error(`Circuit breaker ouvert pour ${functionName}`);
      }

      const response = await this.executeWithRetry(
        functionName,
        payload,
        options.maxRetries || 3,
        options.timeout || this.defaultTimeout,
        call
      );

      call.success = true;
      call.response = response;
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;

      this.updateStats(functionName, call);
      this.onSuccessfulCall(functionName);

      return response;

    } catch (error) {
      call.success = false;
      call.error = error instanceof Error ? error.message : String(error);
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;

      this.updateStats(functionName, call);
      this.onFailedCall(functionName);

      throw error;
    } finally {
      this.cleanupOldCalls();
    }
  }

  /**
   * Exécute l'appel avec retry automatique
   */
  private async executeWithRetry(
    functionName: string,
    payload: any,
    maxRetries: number,
    timeout: number,
    call: EdgeFunctionCall
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Délai avant retry
          await this.sleep(this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)]);
          call.retryCount = attempt;
        }

        return await this.performCall(functionName, payload, timeout);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Ne retry pas sur certaines erreurs
        if (this.isNonRetryableError(lastError)) {
          break;
        }
      }
    }

    throw lastError || new Error('Échec de l\'appel après retries');
  }

  /**
   * Effectue l'appel réel à l'Edge Function
   */
  private async performCall(
    functionName: string,
    payload: any,
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Vérifie si l'erreur ne doit pas déclencher de retry
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'authentication',
      'unauthorized',
      'forbidden',
      'not found',
      'validation'
    ];

    const message = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Vérifie si le circuit breaker est fermé
   */
  private isCircuitClosed(functionName: string): boolean {
    const breaker = this.circuitBreakers.get(functionName);
    if (!breaker) return true;

    const now = Date.now();

    switch (breaker.state) {
      case 'closed':
        return true;
      
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half-open';
          this.circuitBreakers.set(functionName, breaker);
          return true;
        }
        return false;
      
      case 'half-open':
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Gère un appel réussi
   */
  private onSuccessfulCall(functionName: string): void {
    const breaker = this.circuitBreakers.get(functionName);
    if (breaker && breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      this.circuitBreakers.set(functionName, breaker);
    }
  }

  /**
   * Gère un appel échoué
   */
  private onFailedCall(functionName: string): void {
    let breaker = this.circuitBreakers.get(functionName);
    
    if (!breaker) {
      breaker = {
        functionName,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        threshold: 5,
        timeout: 60000
      };
    }

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= breaker.threshold) {
      breaker.state = 'open';
      breaker.nextAttemptTime = Date.now() + breaker.timeout;
    }

    this.circuitBreakers.set(functionName, breaker);
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(functionName: string, call: EdgeFunctionCall): void {
    let stats = this.stats.get(functionName);
    
    if (!stats) {
      stats = {
        functionName,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageDuration: 0,
        errorRate: 0,
        lastCall: 0,
        isHealthy: true
      };
    }

    stats.totalCalls++;
    stats.lastCall = call.startTime;

    if (call.success) {
      stats.successfulCalls++;
    } else {
      stats.failedCalls++;
    }

    if (call.duration) {
      stats.averageDuration = (stats.averageDuration * (stats.totalCalls - 1) + call.duration) / stats.totalCalls;
    }

    stats.errorRate = (stats.failedCalls / stats.totalCalls) * 100;
    stats.isHealthy = stats.errorRate < 10 && stats.averageDuration < 10000;

    this.stats.set(functionName, stats);
  }

  /**
   * Retourne les statistiques d'une fonction
   */
  getFunctionStats(functionName: string): EdgeFunctionStats | null {
    return this.stats.get(functionName) || null;
  }

  /**
   * Retourne toutes les statistiques
   */
  getAllStats(): EdgeFunctionStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Retourne l'état des circuit breakers
   */
  getCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Force la réouverture d'un circuit breaker
   */
  resetCircuitBreaker(functionName: string): void {
    const breaker = this.circuitBreakers.get(functionName);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.nextAttemptTime = 0;
      this.circuitBreakers.set(functionName, breaker);
    }
  }

  /**
   * Surveille la santé des fonctions
   */
  getHealthReport(): {
    healthy: string[];
    warning: string[];
    critical: string[];
    totalFunctions: number;
  } {
    const stats = this.getAllStats();
    const healthy: string[] = [];
    const warning: string[] = [];
    const critical: string[] = [];

    stats.forEach(stat => {
      if (stat.errorRate > 25 || stat.averageDuration > 20000) {
        critical.push(stat.functionName);
      } else if (stat.errorRate > 10 || stat.averageDuration > 10000) {
        warning.push(stat.functionName);
      } else {
        healthy.push(stat.functionName);
      }
    });

    return {
      healthy,
      warning,
      critical,
      totalFunctions: stats.length
    };
  }

  /**
   * Nettoie les anciens appels
   */
  private cleanupOldCalls(): void {
    if (this.calls.size <= this.maxCallHistory) return;

    const calls = Array.from(this.calls.entries());
    calls.sort((a, b) => a[1].startTime - b[1].startTime);
    
    const toDelete = calls.slice(0, calls.length - this.maxCallHistory);
    toDelete.forEach(([id]) => this.calls.delete(id));
  }

  /**
   * Génère un ID unique pour l'appel
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Nettoie les données anciennes
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    // Nettoie les appels anciens
    for (const [id, call] of this.calls.entries()) {
      if (call.startTime < cutoff) {
        this.calls.delete(id);
      }
    }
  }
}

// Instance globale de l'optimiseur Edge Functions
export const edgeFunctionOptimizer = new EdgeFunctionOptimizer();

// Wrappers pour les fonctions spécifiques de Calmiverse
export class CalmiEdgeFunctions {
  private static instance: CalmiEdgeFunctions;
  private optimizer = edgeFunctionOptimizer;

  static getInstance(): CalmiEdgeFunctions {
    if (!CalmiEdgeFunctions.instance) {
      CalmiEdgeFunctions.instance = new CalmiEdgeFunctions();
    }
    return CalmiEdgeFunctions.instance;
  }

  async generateStory(payload: {
    storyId: string;
    objective: string;
    childrenNames: string[];
    childrenData: any[];
  }): Promise<any> {
    return this.optimizer.executeFunction('generateStory', payload, {
      timeout: 45000,
      maxRetries: 2
    });
  }

  async regenerateStory(payload: {
    storyId: string;
    settings: any;
  }): Promise<any> {
    return this.optimizer.executeFunction('regenerateStory', payload, {
      timeout: 45000,
      maxRetries: 2
    });
  }

  async uploadAudio(payload: {
    storyId: string;
    audioData: any;
  }): Promise<any> {
    return this.optimizer.executeFunction('upload-audio-from-n8n', payload, {
      timeout: 60000,
      maxRetries: 1
    });
  }

  getHealthStatus(): any {
    return this.optimizer.getHealthReport();
  }
}

export const calmiEdgeFunctions = CalmiEdgeFunctions.getInstance();