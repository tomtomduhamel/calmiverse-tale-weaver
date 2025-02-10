
import { AlertThresholds } from '../types';

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  executionTimeMs: 30000,
  maxRetries: 3,
  errorRateThreshold: 0.05,
  memoryUsageThreshold: 0.8,
  tokenUsageThreshold: 4000,
  concurrentOperationsThreshold: 10
};

export const ALERT_COOLDOWN_MS = 300000; // 5 minutes
