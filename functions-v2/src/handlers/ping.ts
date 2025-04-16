
import * as functions from 'firebase-functions';

export const ping = functions.https.onRequest((request, response) => {
  console.log('Ping reçu !');
  response.json({ status: 'ok', message: 'Firebase Functions v2 opérationnelles' });
});
