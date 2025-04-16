
import { onCall } from 'firebase-functions/v2/https';

/**
 * Simple ping function to test Firebase Functions connectivity
 * Returns current timestamp and environment info
 */
export const ping = onCall(
  { 
    timeoutSeconds: 10,
    memory: '128MiB',
  }, 
  async (request) => {
    console.log('Ping function called');
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Service is available'
    };
  }
);
