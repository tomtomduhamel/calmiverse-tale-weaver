export const ERROR_CONFIG = {
  debug: true,
  retryDelay: 1000,
  maxRetries: 3,
  maxDepth: 5,
  cacheTimeout: 5000,
  ignorePatterns: [
    'cors',
    'feature',
    'ambient-light-sensor',
    'battery',
    'connection',
    'preload',
    'as',
    'link preloaded',
    'postMessage',
    'ResizeObserver loop',
    'Failed to execute \'postMessage\' on \'Window\''
  ]
};