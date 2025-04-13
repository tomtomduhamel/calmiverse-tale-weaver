
import * as admin from 'firebase-admin';
import { generateStory, retryFailedStory } from './handlers/storyHandler';
import { ping } from './handlers/ping';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the cloud functions
export {
  generateStory,
  retryFailedStory,
  ping
};
