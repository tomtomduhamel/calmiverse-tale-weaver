/**
 * Production-safe logging utility
 * Removes console.log in production while maintaining debug capabilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

const isDevelopment = import.meta.env.DEV;

const createLogger = (): Logger => {
  const log = (level: LogLevel, message: string, ...args: any[]) => {
    if (isDevelopment) {
      console[level](`[${level.toUpperCase()}] ${message}`, ...args);
    } else if (level === 'error' || level === 'warn') {
      // In production, only log warnings and errors
      console[level](`[${level.toUpperCase()}] ${message}`, ...args);
    }
  };

  return {
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args),
  };
};

export const logger = createLogger();