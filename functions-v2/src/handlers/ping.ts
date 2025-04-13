
import { onCall } from 'firebase-functions/v2/https';

/**
 * Simple ping function to check if Firebase Functions are available
 */
export const ping = onCall(
  {
    timeoutSeconds: 10,
    memory: '128MB',
  },
  async (request) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Firebase Functions are available'
    };
  }
);
