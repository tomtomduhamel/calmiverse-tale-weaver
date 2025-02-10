
export interface AlertThresholds {
  executionTimeMs: number;
  maxRetries: number;
  errorRateThreshold: number;
  memoryUsageThreshold: number;
  tokenUsageThreshold: number;
  concurrentOperationsThreshold: number;
}

export type AlertType = 
  | 'HIGH_CONCURRENT_OPERATIONS'
  | 'HIGH_ERROR_RATE'
  | 'EXECUTION_TIME_EXCEEDED'
  | 'MAX_RETRIES_EXCEEDED'
  | 'HIGH_MEMORY_USAGE'
  | 'HIGH_TOKEN_USAGE';

export interface AlertData {
  type: AlertType;
  details: Record<string, any>;
  timestamp: string;
}
