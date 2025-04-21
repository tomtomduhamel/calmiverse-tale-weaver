
import * as functions from 'firebase-functions';

export const ping = functions.https.onCall(async (data, context) => {
  console.log('Ping function called');
  return {
    status: 'success',
    message: 'Pong!',
    timestamp: new Date().toISOString()
  };
});
