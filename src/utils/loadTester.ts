/**
 * Load testing simulation for capacity planning
 * Simulates user behavior to test 100+ concurrent users
 */

interface LoadTestConfig {
  maxUsers: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of users
  actions: LoadTestAction[];
}

interface LoadTestAction {
  type: 'navigate' | 'api_call' | 'wait' | 'interaction';
  target?: string;
  duration?: number;
  probability?: number;
}

interface LoadTestResult {
  totalUsers: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  capacity: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
}

class LoadTester {
  private activeUsers = 0;
  private results: LoadTestResult | null = null;
  private isRunning = false;

  // Test scenarios based on typical Calmiverse usage
  private defaultScenarios: LoadTestScenario[] = [
    {
      name: 'Story Creation Flow',
      weight: 40,
      actions: [
        { type: 'navigate', target: '/' },
        { type: 'api_call', target: '/api/children' },
        { type: 'wait', duration: 2000 },
        { type: 'api_call', target: '/api/stories/create', probability: 0.8 },
        { type: 'wait', duration: 5000 },
        { type: 'navigate', target: '/library' }
      ]
    },
    {
      name: 'Story Reading',
      weight: 35,
      actions: [
        { type: 'navigate', target: '/library' },
        { type: 'api_call', target: '/api/stories' },
        { type: 'wait', duration: 1000 },
        { type: 'navigate', target: '/reader/:id' },
        { type: 'wait', duration: 30000 }, // Reading time
        { type: 'api_call', target: '/api/audio', probability: 0.6 }
      ]
    },
    {
      name: 'Profile Management',
      weight: 15,
      actions: [
        { type: 'navigate', target: '/children' },
        { type: 'api_call', target: '/api/children' },
        { type: 'interaction', target: 'create_child', probability: 0.3 },
        { type: 'api_call', target: '/api/children/create', probability: 0.3 },
        { type: 'wait', duration: 3000 }
      ]
    },
    {
      name: 'Browse and Share',
      weight: 10,
      actions: [
        { type: 'navigate', target: '/library' },
        { type: 'api_call', target: '/api/stories' },
        { type: 'interaction', target: 'share_story', probability: 0.2 },
        { type: 'api_call', target: '/api/share', probability: 0.2 },
        { type: 'navigate', target: '/settings' }
      ]
    }
  ];

  async runLoadTest(config: Partial<LoadTestConfig> = {}): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    const fullConfig: LoadTestConfig = {
      maxUsers: 100,
      rampUpTime: 60, // 1 minute ramp up
      testDuration: 300, // 5 minutes
      scenarios: this.defaultScenarios,
      ...config
    };

    this.isRunning = true;
    console.log(`🧪 Starting load test: ${fullConfig.maxUsers} users over ${fullConfig.testDuration}s`);

    try {
      const result = await this.executeLoadTest(fullConfig);
      this.results = result;
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = Date.now();
    const requestTimes: number[] = [];
    const errors: number[] = [];
    let totalRequests = 0;

    // Simulate gradual user ramp-up
    const usersPerSecond = config.maxUsers / config.rampUpTime;
    
    for (let second = 0; second < config.rampUpTime; second++) {
      const newUsers = Math.floor(usersPerSecond);
      
      for (let i = 0; i < newUsers; i++) {
        this.simulateUser(config.scenarios, requestTimes, errors, () => totalRequests++);
      }

      this.activeUsers += newUsers;
      await this.wait(1000);
    }

    // Run at full capacity for remaining duration
    const remainingTime = config.testDuration - config.rampUpTime;
    await this.wait(remainingTime * 1000);

    // Calculate results
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const successfulRequests = totalRequests - errors.length;
    const averageResponseTime = requestTimes.length > 0 
      ? requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length 
      : 0;
    const maxResponseTime = requestTimes.length > 0 ? Math.max(...requestTimes) : 0;
    const requestsPerSecond = totalRequests / duration;
    const errorRate = totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0;

    return {
      totalUsers: config.maxUsers,
      successfulRequests,
      failedRequests: errors.length,
      averageResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errorRate,
      capacity: this.assessCapacity(errorRate, averageResponseTime, requestsPerSecond),
      recommendations: this.generateRecommendations(errorRate, averageResponseTime, requestsPerSecond)
    };
  }

  private async simulateUser(
    scenarios: LoadTestScenario[], 
    requestTimes: number[], 
    errors: number[],
    incrementTotal: () => void
  ) {
    // Select scenario based on weight
    const scenario = this.selectScenario(scenarios);
    
    for (const action of scenario.actions) {
      if (action.probability && Math.random() > action.probability) {
        continue;
      }

      await this.executeAction(action, requestTimes, errors, incrementTotal);
    }
  }

  private selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
    const random = Math.random() * 100;
    let weightSum = 0;
    
    for (const scenario of scenarios) {
      weightSum += scenario.weight;
      if (random <= weightSum) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  private async executeAction(
    action: LoadTestAction, 
    requestTimes: number[], 
    errors: number[],
    incrementTotal: () => void
  ) {
    const startTime = Date.now();

    try {
      switch (action.type) {
        case 'api_call':
          await this.simulateApiCall(action.target);
          incrementTotal();
          requestTimes.push(Date.now() - startTime);
          break;
        
        case 'navigate':
          await this.simulateNavigation(action.target);
          break;
        
        case 'wait':
          await this.wait(action.duration || 1000);
          break;
        
        case 'interaction':
          await this.simulateInteraction(action.target);
          break;
      }
    } catch (error) {
      errors.push(Date.now());
      incrementTotal();
    }
  }

  private async simulateApiCall(endpoint: string): Promise<void> {
    // Simulate API response time based on endpoint complexity
    const baseDelay = this.getBaseDelay(endpoint);
    const jitter = Math.random() * 500; // Add randomness
    const delay = baseDelay + jitter;

    await this.wait(delay);

    // Simulate occasional errors
    if (Math.random() < 0.02) { // 2% error rate
      throw new Error(`Simulated API error for ${endpoint}`);
    }
  }

  private getBaseDelay(endpoint: string): number {
    // Realistic response times for different endpoints
    if (endpoint.includes('/stories/create')) return 3000; // Story generation
    if (endpoint.includes('/audio')) return 2000; // Audio processing
    if (endpoint.includes('/stories')) return 800; // Story listing
    if (endpoint.includes('/children')) return 500; // Children data
    if (endpoint.includes('/share')) return 1200; // Sharing
    return 600; // Default
  }

  private async simulateNavigation(route: string): Promise<void> {
    // Simulate page load time
    const loadTime = 200 + Math.random() * 800; // 200-1000ms
    await this.wait(loadTime);
  }

  private async simulateInteraction(interaction: string): Promise<void> {
    // Simulate user thinking/interaction time
    const thinkTime = 1000 + Math.random() * 3000; // 1-4 seconds
    await this.wait(thinkTime);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private assessCapacity(
    errorRate: number, 
    avgResponseTime: number, 
    requestsPerSecond: number
  ): LoadTestResult['capacity'] {
    if (errorRate > 10 || avgResponseTime > 5000) return 'critical';
    if (errorRate > 5 || avgResponseTime > 3000 || requestsPerSecond < 10) return 'warning';
    if (errorRate > 2 || avgResponseTime > 2000) return 'good';
    return 'excellent';
  }

  private generateRecommendations(
    errorRate: number, 
    avgResponseTime: number, 
    requestsPerSecond: number
  ): string[] {
    const recommendations: string[] = [];

    if (errorRate > 5) {
      recommendations.push('Taux d\'erreur élevé - renforcer la gestion d\'erreurs et la stabilité');
    }

    if (avgResponseTime > 3000) {
      recommendations.push('Temps de réponse lent - optimiser les requêtes base de données et ajouter de la mise en cache');
    }

    if (requestsPerSecond < 20) {
      recommendations.push('Faible throughput - optimiser les performances serveur et considérer la mise à l\'échelle');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance satisfaisante pour 100 utilisateurs simultanés');
    }

    return recommendations;
  }

  getLastResults(): LoadTestResult | null {
    return this.results;
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }
}

export const loadTester = new LoadTester();