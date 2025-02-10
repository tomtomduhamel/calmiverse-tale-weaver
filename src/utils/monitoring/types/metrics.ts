
export interface ProcessingStep {
  step: string;
  duration: number;
  status: 'success' | 'error';
  timestamp: string;
}

export interface ProcessingStats {
  wordCount: number;
  tokensUsed: number;
  promptLength: number;
  responseLength: number;
  processingSteps: ProcessingStep[];
}

export interface NetworkStats {
  requestDuration: number;
  responseSize: number;
  statusCode: number;
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: string;
  stack?: string;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error' | 'timeout';
  retryCount: number;
  errorDetails?: ErrorDetails;
  memoryUsage?: MemoryStats;
  processingStats?: ProcessingStats;
  networkStats?: NetworkStats;
}
